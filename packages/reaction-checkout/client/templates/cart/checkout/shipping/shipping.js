//
// These helpers can be used in general shipping packages
// cartShippingMethods to get current shipment methods
// until we handle multiple methods, we just use the first
function cartShippingMethods(currentCart) {
  let cart = currentCart || ReactionCore.Collections.Cart.findOne();
  if (cart) {
    if (cart.shipping) {
      if (cart.shipping[0].shipmentQuotes) {
        return cart.shipping[0].shipmentQuotes;
      }
    }
  }
  return undefined;
}
// getShipmentMethod to get current shipment method
// until we handle multiple methods, we just use the first
function getShipmentMethod(currentCart) {
  let cart = currentCart || ReactionCore.Collections.Cart.findOne();
  if (cart) {
    if (cart.shipping) {
      if (cart.shipping[0].shipmentMethod) {
        return cart.shipping[0].shipmentMethod;
      }
    }
  }
  return undefined;
}

Template.coreCheckoutShipping.onCreated(function () {
  this.autorun(() => {
    this.subscribe("Shipping");
  });
});

Template.coreCheckoutShipping.helpers({
  // retrieves current rates and updates shipping rates
  // in the users cart collection (historical, and prevents repeated rate lookup)
  shipmentQuotes: function () {
    const cart = ReactionCore.Collections.Cart.findOne();
    return cartShippingMethods(cart);
  },

  // helper to make sure there are some shipping providers
  shippingConfigured: function () {
    const instance = Template.instance();
    if (instance.subscriptionsReady()) {
      return ReactionCore.Collections.Shipping.find({
        "methods.enabled": true
      }).count();
    }
  },

  // helper to display currently selected shipmentMethod
  isSelected: function () {
    let self = this;
    let shipmentMethod = getShipmentMethod();
    // if there is already a selected method, set active
    if (_.isEqual(self.method, shipmentMethod)) {
      return "active";
    }
    return null;
  }
});

//
// Set and store cart shipmentMethod
// this copies from shipmentMethods (retrieved rates)
// to shipmentMethod (selected rate)
//
Template.coreCheckoutShipping.events({
  "click .list-group-item": function (event) {
    event.preventDefault();
    event.stopPropagation();
    let self = this;
    let cart = ReactionCore.Collections.Cart.findOne();

    try {
      Meteor.call("cart/setShipmentMethod", cart._id, self.method);
    } catch (error) {
      throw new Meteor.Error(error,
        "Cannot change methods while processing.");
    }
  }
});
