###
# methods typically used for checkout (shipping, taxes, etc)
###
Meteor.methods
  ###
  # gets shipping rates and updates the users cart methods
  ###
  updateCartShippingRates: (cartSession) ->
    unless cartSession
      console.log "no cart passed to update rates, return null." if Meteor.settings.isDebug
      return null
    if cartSession.shipping?.address and cartSession.shipping?.shipmentMethods then return

    cart = Cart.findOne(cartSession._id)
    rates = Meteor.call "getShippingRates"
    # update users cart
    Cart.update(cartSession._id, { $set: {'shipping.shipmentMethods': rates}})
    # return in the rates object
    return rates

  ###
  #  just gets rates, without updating anything
  ###
  getShippingRates: () ->
    rates = []
    shipping = ReactionCore.Collections.Shipping.find({'shopId': ReactionCore.getShopId()})
    # flat rate / table shipping rates
    shipping.forEach (shipping) ->
      ## get all enabled rates
      for method, index in shipping.methods when method.enabled is true
        unless method.rate then method.rate = 0
        # rules

        # rate is shipping and handling
        rate = method.rate + method.handling
        rates.push carrier: shipping.provider.label, method: method, rate: rate


      console.log rates if Meteor.settings.isDebug
      console.log "returning rates" if Meteor.settings.isDebug

    # TODO:
    # wire in external shipping methods here, add to rates

    # return in the rates object
    return rates

  ###
  # Update Shipping methods for a provider
  ###
  updateShippingMethods: (providerId, insertDoc, updateDoc, currentDoc) ->
    unless currentDoc.provider #if our current doc isn't a shipping method, we'll add one.
      result = ReactionCore.Collections.Shipping.update({'_id': providerId, 'methods': currentDoc}, {$set: {'methods.$': insertDoc} })
    else
      result = ReactionCore.Collections.Shipping.update({'_id': providerId }, {$addToSet: {'methods': insertDoc} })
    return result

  removeShippingMethod: (providerId, removeDoc) ->

    ReactionCore.Collections.Shipping.update({'_id': providerId, 'methods': removeDoc}, {$pull: {'methods': removeDoc} })

