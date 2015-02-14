Template.addressBookEdit.helpers
  thisAddress: ->
    addressId = Session.get "addressBookView"
    for address in Meteor.user().profile.addressBook
      if address._id is addressId
        thisAddress = address
    thisAddress


Template.addressBookEdit.events
  'click #cancel-address-edit': () ->
    Session.set "addressBookView", "view"

