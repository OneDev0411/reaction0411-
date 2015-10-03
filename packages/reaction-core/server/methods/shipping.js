/*
 * ReactionCore Shipping Methods
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
      return;
    }
    check(cartId, String);
    this.unblock();
    let cart = ReactionCore.Collections.Cart.findOne(cartId);
    if (cart) {
      let rates = Meteor.call("shipping/getShippingRates", cart);

      if (!rates) {
        return;
      }

      if (rates.length > 0) {
        ReactionCore.Collections.Cart.update({
          _id: cartId
        }, {
          $set: {
            "shipping.shipmentQuotes": rates
          }
        });
      }
      ReactionCore.Log.debug(rates);
    }
  },

  /**
   * shipping/getShippingRates
   * @summary just gets rates, without updating anything
   * @param {Object} cart - cart object
   * @return {Array} return updated rates in cart
   */
  "shipping/getShippingRates": function (cart) {
    check(cart, Object);
    let rates = [];
    let shops = [];
    let products = cart.items;
    // default selector is current shop
    let selector = {
      shopId: ReactionCore.getShopId()
    };
    // must have products to calculate shipping
    if (!cart.items) {
      return [];
    }
    // create an array of shops, allowing
    // the cart to have products from multiple shops
    for (let product of products) {
      if (product.shopId) {
        shops.push(product.shopId);
      }
    }
    // if we have multiple shops in cart
    if ((shops !== null ? shops.length : void 0) > 0) {
      selector = {
        shopId: {
          $in: shops
        }
      };
    }

    let shippingMethods = ReactionCore.Collections.Shipping.find(selector);

    shippingMethods.forEach(function (shipping) {
      let _results = [];
      for (let method of shipping.methods) {
        if (!(method.enabled === true)) {
          continue;
        }
        if (!method.rate) {
          method.rate = 0;
        }
        if (!method.handling) {
          method.handling = 0;
        }
        rate = method.rate + method.handling;
        _results.push(rates.push({
          carrier: shipping.provider.label,
          method: method,
          rate: rate,
          shopId: shipping.shopId
        }));
      }
      return _results;
    });
    ReactionCore.Log.info("getShippingrates returning rates");
    ReactionCore.Log.debug("rates", rates);
    return rates;
  }
});
