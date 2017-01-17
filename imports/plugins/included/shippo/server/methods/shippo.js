/* eslint camelcase: 0 */
import { Reaction } from "/server/api";
import { Packages, Accounts, Shops, Shipping, Cart, Orders } from "/lib/collections";
import { ShippoPackageConfig } from "../../lib/collections/schemas";
import { ShippoApi } from "./shippoapi";

// Creates an address (for sender or recipient) suitable for Shippo Api Calls given
// a reaction address an email and a purpose("QUOTE"|"PURCHASE")
function createShippoAddress(reactionAddress, email, purpose) {
  const shippoAddress = {
    object_purpose: purpose,
    name: reactionAddress.fullName,
    street1: reactionAddress.address1,
    street2: reactionAddress.address2 || "", // "" in order to be cleaned later by SimpleSchema.clean
    city: reactionAddress.city,
    company: reactionAddress.company || "",
    state: reactionAddress.region,
    zip: reactionAddress.postal,
    country: reactionAddress.country,
    phone: reactionAddress.phone,
    email: email,
    is_residential: !reactionAddress.isCommercial
  };

  return shippoAddress;
}

// Creates a parcel object suitable for Shippo Api Calls given
// a reaction product's parcel and units of measure for mass and distance
function createShippoParcel(reactionParcel, reactionMassUnit, reactionDistanceUnit) {
  const shippoParcel = {
    width: reactionParcel.width || "",
    length: reactionParcel.length || "",
    height: reactionParcel.height || "",
    weight: reactionParcel.weight || "",
    distance_unit: reactionDistanceUnit.toLowerCase(), // Propably we need to have for each shop a uom/baseuom for distance
    mass_unit: reactionMassUnit.toLowerCase()
  };

  return shippoParcel;
}

// converts the Rates List fetched from the Shippo Api to Reaction Shipping Rates form
function ratesParser(shippoRates, shippoDocs) {
  return shippoRates.map(rate => {
    const rateAmount = parseFloat(rate.amount);
    // const methodLabel = `${rate.provider} - ${rate.servicelevel_name}`;
    const reactionRate = {
      carrier: rate.provider,
      method: {
        enabled: true,
        label: rate.servicelevel_name,
        rate: rateAmount,
        handling: 0,
        carrier: rate.provider,
        shippoMethod: {
          // carrierAccount: rate.carrier_account,
          rateId: rate.object_id,
          serviceLevelToken: rate.servicelevel_token
        }
      },
      rate: rateAmount,
      shopId: shippoDocs[rate.carrier_account].shopId
    };

    return reactionRate;
  });
}

// Filters the carrier list and gets and parses only the ones that are activated in the Shippo Account
function filterActiveCarriers(carrierList) {
  let activeCarriers = [];
  if (carrierList.results && carrierList.count) {
    carrierList.results.forEach(carrier => {
      if (carrier.active) {
        activeCarriers.push({
          carrier: carrier.carrier, // this is a property of the returned result with value the name of the carrier
          carrierAccountId: carrier.object_id
        });
      }
    });

    return activeCarriers;
  }
}

// usps_express to USPS EXPRESS .We need a better approach - use a suitable static map object
function formatCarrierLabel(carrierName) {
  return carrierName.replace(/_/g, " ").toUpperCase();
}

// get Shippo's Api Key from the Shippo package with the supplied shopId or alternatively of the current shop's Id
function getApiKey(shopId = Reaction.getShopId) {
  const { settings } = Packages.findOne({
    name: "reaction-shippo",
    shopId
  });

  return settings.apiKey;
}

// Adds Shippo carriers in Shipping Collection (one doc per carrier) for the current Shop
function addShippoProviders(carriers, shopId = Reaction.getShopId()) {
  let result = true;
  carriers.forEach(carrier => {
    const carrierName = carrier.carrier;
    const carrierLabel = formatCarrierLabel(carrierName);
    const currentResult = Shipping.insert({
      name: `${carrierLabel}`, // check it later for a better name
      methods: [],
      provider: {
        name: carrierName,
        label: carrierLabel,
        enabled: true,
        shippoProvider: {
          carrierAccountId: carrier.carrierAccountId
        }
      },
      shopId
    });
    result = result && currentResult;
  });

  return result;
}

// Remove from Shipping Collection shop's Shippo Providers with carrier account Id in carriersIds
// or all of them (if carriersIds is set to false)
function removeShippoProviders(carriersIds, shopId = Reaction.getShopId()) {
  if (carriersIds) {
    return Shipping.remove({
      shopId,
      "provider.shippoProvider.carrierAccountId": { $in: carriersIds }
    });
  }

  return Shipping.remove({
    shopId,
    "provider.shippoProvider": { $exists: true }
  });
}

// After getting the current active Carriers of the Shippo Account removes
// from the Shipping Collection the Shippo providers that are deactivated(don't exist in active carriers)
// and inserts the newly active carriers in Shipping Collection as shippo providers.

function updateShippoProviders(activeCarriers, shopId = Reaction.getShopId()) {
  const currentShippoProviders = Shipping.find({
    "shopId": shopId,
    "provider.shippoProvider": { $exists: true }
  }, {
    fields: { "provider.shippoProvider.carrierAccountId": 1 }
  });

  // Ids of Shippo Carriers that exist currently as docs in Shipping Collection
  const currentCarriersIds = currentShippoProviders.map(doc => doc.provider.shippoProvider.carrierAccountId);

  let newActiveCarriers = [];
  let unchangedActiveCarriersIds = [];
  activeCarriers.forEach(carrier => {
    const carrierId = carrier.carrierAccountId;
    if (!currentCarriersIds.includes(carrierId)) {
      newActiveCarriers.push(carrier);
    } else {
      unchangedActiveCarriersIds.push(carrierId);
    }
  });

  const deactivatedCarriersIds = _.difference(currentCarriersIds, unchangedActiveCarriersIds);
  if (deactivatedCarriersIds.length) {
    removeShippoProviders(deactivatedCarriersIds, shopId);
  }
  if (newActiveCarriers.length) {
    addShippoProviders(newActiveCarriers, shopId);
  }

  return true;
}

Meteor.methods({

  /**
   * Updates the Api key(Live/Test Token) used for connection with the Shippo account.
   * Also inserts(and deletes if already exist) docs in the Shipping collection each of the
   * activated Carriers of the Shippo account.
   * This method is intended to be used mainly by Autoform.
   * @param {Object} modifier - The Autoform's modifier string
   * @param {_id} string - The id of the Shippo package that gets updated
   * @return {Object} result - The object returned.
   * @return {string("update"|"delete")} result.type - The type of updating happened.
   * */
  "shippo/updateApiKey"(modifier, _id) {
    // Important server-side check for security and data integrity
    check(modifier, ShippoPackageConfig);
    check(_id, String);

    // Make sure user has proper rights to this package
    const { shopId } = Packages.findOne({ _id },
                                        { field: { shopId: 1 } });
    if (shopId && Roles.userIsInRole(this.userId, ["admin", "owner"], shopId)) {
      // If user wants to delete existing key
      if (modifier.hasOwnProperty("$unset")) {
        const customModifier = { $set: { "settings.apiKey": null } };
        Packages.update(_id, customModifier);
        // remove shop's existing Shippo Providers from Shipping Collection
        removeShippoProviders(false, shopId);

        return { type: "delete" };
      }

      const apiKey = modifier.$set["settings.apiKey"];

      // Tries to use the apiKey by fetching a list of the addresses of Shippo Account
      // if not possible throws a relative Meteor Error (eg invalid_credentials)
      ShippoApi.methods.getAddressList.call({ apiKey });
      // if everything is ok proceed with the api key update
      Packages.update(_id, modifier);
      // remove shop's existing Shippo Providers from Shipping Collection
      removeShippoProviders(false, shopId);

      const activeCarriers = filterActiveCarriers(ShippoApi.methods.getCarrierAccountsList.call({ apiKey }));
      if (activeCarriers.length) {
        addShippoProviders(activeCarriers, shopId);
      }

      return { type: "update" };
    }

    return false;
  },

  /**
   * Fetches the current active Shippo Carriers from the Shippo Account and updates the
   * Shipping Collection by keeping only these as Shippo Providers of the shop.
   * @return {Boolean} result - if the updating happened succesfully or not.
   * */

  "shippo/fetchProviders"() {
    const shopId = Reaction.getShopId();

    if (Roles.userIsInRole(this.userId, ["admin", "owner"], shopId)) {

      const apiKey = getApiKey(shopId);
      if (!apiKey) {
        return false;
      }

      const activeCarriers = filterActiveCarriers(ShippoApi.methods.getCarrierAccountsList.call({ apiKey }));
      return updateShippoProviders(activeCarriers, shopId);
    }

    return false;
  },

  /**
   * Returns the available Shippo Methods/Rates for a selected cart, in the same form shipping/getShippingRates
   * returns them.
   * @param {String} cartId - The id of the cart that rates are to be supplied.
   * @param {Object} shippoDocs - Contains all the Enabled Shipping Objects with provider.shippoProvider property.
   * Each property has as key the Shippo's carrierAccountId and as value the corresponding document of shipping
   * collection.
   * @return {Array} rates - The rates of the enabled and available Shippo carriers.
   * */
  "shippo/getShippingRatesForCart"(cartId, shippoDocs) {
    check(cartId, String);
    check(shippoDocs, Object);
    const cart = Cart.findOne(cartId);
    if (cart && cart.userId === this.userId) { // confirm user has the right
      let shippoAddressFrom;
      let shippoAddressTo;
      let shippoParcel;
      const purpose = "PURCHASE";

      const shop = Shops.findOne({
        _id: cart.shopId
      }, {
        field: {
          addressBook: 1,
          emails: 1,
          unitsOfMeasure: { $elemMatch: { default: true } }
        }
      });

      const apiKey = getApiKey(cart.shopId);
      // If for a weird reason Shop hasn't a Shippo Api key anymore return no-rates.
      if (!apiKey) {
        return [];
      }

      shippoAddressFrom = createShippoAddress(shop.addressBook[0], shop.emails[0].address, purpose);
      // product in the cart has to have parcel property with the dimensions
      if (cart.items && cart.items[0] && cart.items[0].parcel) {
        const unitOfMeasure = shop && shop.unitsOfMeasure && shop.unitsOfMeasure[0].uom || "KG";
        // at the moment shops don't have a kind of unitOfMeasure for distance
        // so we put CM...
        shippoParcel = createShippoParcel(cart.items[0].parcel, unitOfMeasure, "CM");
      } else {
        return [];
      }

      const buyer = Accounts.findOne({
        _id: this.userId
      }, {
        field: { emails: 1 }
      });
      // check that there is address available in cart
      if (cart.shipping && cart.shipping[0] && cart.shipping[0].address) {
        shippoAddressTo = createShippoAddress(cart.shipping[0].address, buyer.emails[0].address, purpose);
      } else {
        return [];
      }
      const carrierAccounts = Object.keys(shippoDocs);
      const shippoShipment = ShippoApi.methods.createShipment.call({
        shippoAddressFrom,
        shippoAddressTo,
        shippoParcel,
        purpose,
        carrierAccounts,
        apiKey
      });
      const shippoRates = shippoShipment.rates_list;
      const reactionRates = ratesParser(shippoRates, shippoDocs);

      return reactionRates;
    }

    return false;
  },

  /**
   * Confirms Shippo order based on buyer's choice at the time of purchase
   * and supplies the order doc with the tracking and label infos
   * @param {String} orderId - The id of the ordered that labels are purchased for
   * @return {Boolean} result - True if procedure completed succesfully,otherwise false
   */
  "shippo/confirmShippingMethodForOrder"(orderId) {
    check(orderId, String);
    const order = Orders.findOne(orderId);
    // Make sure user has permissions in the shop's order
    if (Roles.userIsInRole(this.userId, ["admin", "owner"], order.shopId)) {
      // Here we done it for the first/unique Shipment only . in the near future it will be done for multiple ones
      if (order.shipping[0].shipmentMethod.shippoMethod &&
      order.shipping[0].shipmentMethod.shippoMethod.rateId) {
        const apiKey = getApiKey(order.shopId);
        // If for a weird reason Shop hasn't a Shippo Api key anymore you have to throw an error
        // cause the Shippo label purchasing is not gonna happen.
        if (!apiKey) {
          throw new Meteor.Error("403", "Invalid Shippo Credentials");
        }
        const rateId = order.shipping[0].shipmentMethod.shippoMethod.rateId;
        // make the actual purchase
        const shippoLabel = ShippoApi.methods.createTransaction.call({ rateId, apiKey });

        return Orders.update({
          _id: orderId
        }, {
          $set: {
            "shipping.0.shippingLabelUrl": shippoLabel.label_url,
            "shipping.0.tracking": shippoLabel.tracking_number
          }
        });
      }
    }

    return false;
  }
});
