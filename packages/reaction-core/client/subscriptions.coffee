###
# Create persistent sessions for users
# The server returns only one record, so findOne will return that record
# Stores into client session all data contained in server session
# supports reactivity when server changes the serverSession
# Stores the server session id into local storage / cookies
###
Meteor.subscribe "ReactionSessions", amplify.store("reaction.session"), ->
  serverSession = new Meteor.Collection("ReactionSessions").findOne()
  Session.set "serverSession", serverSession
  Session.set "sessionId", serverSession._id
  amplify.store "reaction.session", serverSession._id

###
# General Subscriptions
###
PackagesHandle = @PackagesHandle = Meteor.subscribe("Packages")
ReactionConfigHandle = Meteor.subscribe "ReactionConfig"
share.ConfigDataHandle = Meteor.subscribe 'ConfigData'

Meteor.subscribe "cart", Session.get "sessionId", Meteor.userId()
Meteor.subscribe "UserConfig", Meteor.userId()
Meteor.subscribe 'products'
Meteor.subscribe 'orders'
Meteor.subscribe 'customers'
Meteor.subscribe 'tags'
Meteor.subscribe 'shops'
Meteor.subscribe "media"
Meteor.subscribe 'FileStorage'
###
#  Reactive current product
#  This ensures singleton reactive products, without session
#  set usage: currentProduct.set "product",object
#  get usage: currentProduct.get "product"
###
@currentProduct =
  keys: {}
  deps: {}
  get: (key) ->
    @ensureDeps key
    @deps[key].depend()
    @keys[key]
  set: (key, value) ->
    @ensureDeps key
    @keys[key] = value
    @deps[key].changed()
  changed: (key) ->
    @ensureDeps key
    @deps[key].changed()
  ensureDeps: (key) ->
    @deps[key] = new Deps.Dependency  unless @deps[key]

currentProduct = @currentProduct

###
#  Autorun dependencies
#  ensure user cart is created, and address located
###
Deps.autorun ->
  unless (Session.get('address') or Meteor.user()?.profile.addressBook)
    #Setting Default because we get here before location calc
    address = {
      latitude: null,
      longitude: null,
      country: 'United States',
      city: null,
      state: null,
      stateCode: null,
      zipcode: null,
      streetName: null,
      streetNumber: null,
      countryCode: 'US'
    }
    Session.set("address",address)

###
#  Geolocate Methods
#  look up user location at startup
###
Meteor.startup ->
  #Pass the lat/long to google geolocate
  successFunction = (position) ->
    lat = position.coords.latitude
    lng = position.coords.longitude
    Meteor.call "locateAddress", lat, lng, (error, address) ->
      Session.set("address",address)
  errorFunction = ->
    Meteor.call "locateAddress", (error, address) ->
      Session.set("address",address)

  navigator.geolocation.getCurrentPosition successFunction, errorFunction  if navigator.geolocation
