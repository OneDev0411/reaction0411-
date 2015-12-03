Meteor.methods({
  /**
   * payments/paymentMethod
   * @summary adds payment to order
   * @param {String} cartId - cartId
   * @param {Object} paymentMethod - formatted payment method object
   * @returns {String} return cart update result
   */
  "payments/paymentMethod": function (cartId, paymentMethod) {
    check(cartId, String);
    check(paymentMethod, Object);

    // temp hack until we build out multiple payment handlers
    let cart = ReactionCore.Collections.Cart.findOne(cartId);
    let paymentId = "";
    if (cart.biling) {
      paymentId = cart.billing[0]._id;
    }

    return Cart.upsert({
      "_id": cartId,
      "billing._id": paymentId
    }, {
      $addToSet: {
        "billing.paymentMethod": paymentMethod
      }
    });
  }

});
