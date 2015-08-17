###
# These helpers can be used in general shipping packages
# or replaced, but are meant to be generalized in nature.
###
cart = ReactionCore.Collections.Cart.findOne()

Template.coreCheckoutShipping.helpers
  # retrieves current rates and updates shipping rates
  # in the users cart collection (historical, and prevents repeated rate lookup)
  shipmentQuotes: () ->
    cart = ReactionCore.Collections.Cart.findOne()
    return cart?.shipping?.shipmentQuotes

  # helper to make sure there are some shipping providers
  shippingConfigured: () ->
    exists = ReactionCore.Collections.Shipping.find({'methods.enabled': true}).count()
    return exists
  # helper to display currently selected shipmentMethod
  isSelected: (cart)->

    cart = ReactionCore.Collections.Cart.findOne()

    shipmentMethod  = cart?.shipping?.shipmentMethod

    unless shipmentMethod then return
    # if there is already a selected method, set active
    if _.isEqual @.method, shipmentMethod
      return "active"

###
# Set and store cart shipmentMethod
# this copies from shipmentMethods (retrieved rates)
# to shipmentMethod (selected rate)
###
Template.coreCheckoutShipping.events
  'click .list-group-item': (event, template) ->
    cart = ReactionCore.Collections.Cart.findOne()


    # Session.set "shipmentMethod", this.method.name

    # Meteor.call "updateShipmentQuotes", cart._id
    console.log 'OOK WHAT THE HELL', this.method
    Meteor.call "setShipmentMethod", cart._id, this.method

    # Meteor.call "setShipmentAddress", cart._id, @

    # try
    #   Meteor.call "setShipmentAddress", cart._id, @
    # catch
    #   console.info "Cannot change methods while processing."
    #   event.preventDefault()
    #   event.stopPropagation()
    #   return

