import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Cart, Shipping } from "/lib/collections";
import { Logger, Reaction } from "/server/api";
import { Cart as CartSchema } from "/lib/collections/schemas";

//
// function getDynamicShippingMethods(packageId) {
//   const shippingProviderPackage = Packages.findOne({
//     _id: packageId
//   }, {
//     fields: {
//       methodsNamespace: 1
//     }
//   });
//   // Each dynamic shipping provider has to have a method for fetching available shipping
//   // methods/rates with the naming convention: package.methodsNamespace/getShippingMethods
//   // ,for example shippo/getShippingMethods
//   const packageMethodsNamespace = shippingProviderPackage.methodsNamespace;
//   return Meteor.call(packageMethodsNamespace + "getShippingMethods", cart);
// }


/*
 * Reaction Shipping Methods
 * methods typically used for checkout (shipping, taxes, etc)
 */
Meteor.methods({
  /**
   * shipping/updateShipmentQuotes
   * @summary gets shipping rates and updates the users cart methods
   * @todo add orderId argument/fallback
   * @param {String} cartId - cartId
   * @return {undefined}
   */
  "shipping/updateShipmentQuotes": function (cartId) {
    if (!cartId) {
      return [];
    }
    check(cartId, String);
    this.unblock();
    const cart = Cart.findOne(cartId);
    if (cart) {
      const rates = Meteor.call("shipping/getShippingRates", cart);
      // no rates found
      if (!rates) {
        return [];
      }
      let selector;
      let update;
      // temp hack until we build out multiple shipment handlers
      // if we have an existing item update it, otherwise add to set.
      if (cart.shipping && rates.length > 0) {
        selector = {
          "_id": cartId,
          "shipping._id": cart.shipping[0]._id
        };
        update = {
          $set: {
            "shipping.$.shipmentQuotes": rates
          }
        };
      } else {
        selector = {
          _id: cartId
        };
        update = {
          $push: {
            shipping: {
              shipmentQuotes: rates
            }
          }
        };
      }
      // add quotes to the cart
      if (rates.length > 0) {
        Cart.update(selector, update, function (error) {
          if (error) {
            Logger.warn(`Error adding rates to cart ${cartId}`, error);
            return;
          }
          Logger.debug(`Success adding rates to cart ${cartId}`, rates);
        });
      }
    }
  },

  /**
   * shipping/getShippingRates
   * @summary just gets rates, without updating anything
   * @param {Object} cart - cart object
   * @return {Array} return updated rates in cart
   */
  "shipping/getShippingRates": function (cart) {
    check(cart, CartSchema);
    const rates = [];
    const shops = [];
    const products = cart.items;
    // default selector is current shop
    let selector = {
      "shopId": Reaction.getShopId(),
      "provider.enabled": true
    };
    // must have products to calculate shipping
    if (!cart.items) {
      return [];
    }
    // create an array of shops, allowing
    // the cart to have products from multiple shops
    for (const product of products) {
      if (product.shopId) {
        shops.push(product.shopId);
      }
    }
    // if we have multiple shops in cart
    if ((shops !== null ? shops.length : void 0) > 0) {
      selector = {
        "shopId": {
          $in: shops
        },
        "provider.enabled": true
      };
    }

    const shippings = Shipping.find(selector);
    let shippoShippingsProviders = []; //Meteor.call("shippo/getShippingMethodsForCart", cart._id);

    shippings.forEach(function (shipping) {
      const _results = [];
      let shippingMethods;
      // If provider name is Shippo get methods dynamically through shippo account
      if (shipping.shippoShippingProvider.isShippoShippingProvider) {
        shippoShippingProviders.push = shipping.shippoShippingProvider.objectId;
      } else {
        shippingMethods = shipping.methods;
      }
      for (const method of shippingMethods) {
        if (!(method.enabled === true)) {
          continue;
        }
        if (!method.rate) {
          method.rate = 0;
        }
        if (!method.handling) {
          method.handling = 0;
        }
        const rate = method.rate + method.handling;
        _results.push(rates.push({
          carrier: shipping.provider.label,
          method: method,
          rate: rate,
          shopId: shipping.shopId
        }));
      }
      return _results;
    });
    Logger.debug("getShippingRates returning rates", rates);
    return rates;
  }
});
