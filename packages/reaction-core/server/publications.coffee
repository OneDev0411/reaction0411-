Cart  = ReactionCore.Collections.Cart
Accounts = ReactionCore.Collections.Accounts
Discounts = ReactionCore.Collections.Discounts
Media = ReactionCore.Collections.Media
Orders = ReactionCore.Collections.Orders
Packages = ReactionCore.Collections.Packages
Products = ReactionCore.Collections.Products
Shipping =  ReactionCore.Collections.Shipping
Shops = ReactionCore.Collections.Shops
Tags = ReactionCore.Collections.Tags
Taxes = ReactionCore.Collections.Taxes
Translations = ReactionCore.Collections.Translations

###
# Reaction Server / amplify permanent sessions
# If no id is passed we create a new session
# Load the session
# If no session is loaded, creates a new one
###
@ServerSessions = new Mongo.Collection("Sessions")
Meteor.publish 'Sessions', (id) ->
  check id, Match.OneOf(String, null)

  created = new Date().getTime()
  id = ServerSessions.insert(created: created) unless id
  serverSession = ServerSessions.find(id)

  if serverSession.count() is 0
    id = ServerSessions.insert(created: created)
    serverSession = ServerSessions.find(id)
  ReactionCore.sessionId = id
  return serverSession

###
# CollectionFS - Image/Video Publication
###
Meteor.publish "Media", (shops) ->
  check shops, Match.Optional(Array)
  shopId = ReactionCore.getShopId( @)
  if shopId
    selector = {'metadata.shopId': shopId}
    ## add additional shops
  if shops
    selector = {'metadata.shopId': {$in: shops}}
  return Media.find selector,
    sort : {"metadata.priority" : 1}

###
# i18n - translations
###
Meteor.publish "Translations", (sessionLanguage) ->
  check sessionLanguage, String
  return Translations.find({ $or: [{'i18n':'en'},{'i18n': sessionLanguage}] })

###
# userProfile
# get any user name,social profile image
# should be limited, secure information
###
Meteor.publish "UserProfile", (profileUserId) ->
  check profileUserId, Match.OneOf(String, null)
  permissions = ['dashboard/orders','owner','admin','dashboard/customers']
  # admin users can see some additional restricted user details
  if profileUserId isnt @userId and (
      Roles.userIsInRole @userId, permissions, ReactionCore.getCurrentShop(@)._id or
      Roles.userIsInRole @userId, permissions, Roles.GLOBAL_GROUP
      )
      return Meteor.users.find _id: profileUserId,
        fields:
          "emails": true
          "profile.firstName": true
          "profile.lastName": true
          "profile.familyName": true
          "profile.secondName": true
          "profile.name": true
          "services.twitter.profile_image_url_https": true
          "services.facebook.id": true
          "services.google.picture": true
          "services.github.username": true
          "services.instagram.profile_picture": true
  else if @userId
    return Meteor.users.find _id: @userId
  # prevent other access to users
  else
    return []

###
#  Packages contains user specific configuration
#  settings, package access rights
###
Meteor.publish 'Packages', (shop) ->
  shop = shop || ReactionCore.getCurrentShop(@)
  if shop
    if Roles.userIsInRole(@userId, [
        'dashboard'
        'owner'
        'admin'
      ], ReactionCore.getShopId(this) or Roles.userIsInRole(@userId, [
        'owner'
        'admin'
      ], Roles.GLOBAL_GROUP))
      Packages.find shopId: shop._id
    else
      Packages.find { shopId: shop._id }, fields:
        shopId: true
        name: true
        enabled: true
        registry: true
        'settings.public': true
  else
    return []

###
# shops
###
Meteor.publish 'Shops', ->
  ReactionCore.getCurrentShopCursor(@)

###
# ShopMembers
###
Meteor.publish 'ShopMembers', ->
  permissions = ['dashboard/orders','owner','admin','dashboard/customers']
  shopId = ReactionCore.getShopId(@)
  if Roles.userIsInRole(@userId, permissions, shopId)
    return Meteor.users.find()
  else
    ReactionCore.Events.info "ShopMembers access denied"
    return []

###
# products
###
Meteor.publish 'Products', (shops) ->
  check shops, Match.Optional(Array)
  shop = ReactionCore.getCurrentShop(@)
  if shop
    selector = {shopId: shop._id}
    ## add additional shops
    if shops
      selector = {shopId: {$in: shops}}
      ## check if the user is admin in any of the shops
      for shop in shops
        if Roles.userIsInRole this.userId, ['admin','createProduct'], shop
          shopAdmin = true
    unless Roles.userIsInRole(this.userId, ['admin','createProduct'], shop._id) or shopAdmin
      selector.isVisible = true
    return Products.find(selector, {sort: {title: 1}})
  else
    return []

Meteor.publish 'Product', (productId) ->
  check productId, String

  shop = ReactionCore.getCurrentShop(@) #TODO: wire in shop
  if productId.match /^[A-Za-z0-9]{17}$/
    return Products.find(productId)
  else
    return Products.find({handle: { $regex : productId, $options:"i" } })

###
# orders
###
Meteor.publish 'Orders', (userId) ->
  check userId, Match.Optional(String)
  # only admin can get all orders
  if Roles.userIsInRole @userId, ['admin','owner'], ReactionCore.getShopId(@)
    return Orders.find shopId: ReactionCore.getShopId(@)
  else
    return []

###
# account orders
###
Meteor.publish 'AccountOrders', (userId, shopId ) ->
  check userId, Match.OptionalOrNull(String)
  check shopId, Match.OptionalOrNull(String)
  shopId = shopId || ReactionCore.getShopId(@)
  if userId and userId isnt @userId then return []  #cure for null query match and added check

  return Orders.find 'shopId': shopId, 'userId': @userId

###
# cart
###
Meteor.publish 'Cart', (userId) ->
  check userId, Match.OptionalOrNull(String)
  sessionId = ReactionCore.sessionId
  Cart = ReactionCore.Collections.Cart
  unless @userId then return

  # carts are created in Accounts.onCreate
  currentCart = Cart.findOne userId: @userId

  console.log "current cart publication: " + currentCart._id

  sessionCarts = Cart.find({ $or: [{'userId': @userId }, {'sessions': {$in: [sessionId] } } ] })
  if sessionCarts.count() >= 1
    console.log "call merge carts", currentCart._id
    Meteor.call "mergeCart", currentCart._id


  ReactionCore.Events.info "publishing cart: " + currentCart._id + " for " + @userId
  return Cart.find userId: @userId

###
# accounts
###
Meteor.publish 'Accounts', (userId) ->
  check userId, Match.OneOf(String, null)
  # global owner gets it all
  if Roles.userIsInRole @userId, ['owner'], Roles.GLOBAL_GROUP
    return Accounts.find()

  # shop owner / admin sees all, in shop
  else if Roles.userIsInRole @userId, ['admin','owner'], ReactionCore.getShopId(@)
    return Accounts.find shopId: ReactionCore.getShopId(@)

  # returns userId (authenticated account) details only
  else
    accountId = ReactionCore.Collections.Accounts.findOne('userId': @userId)?._id
    if accountId
      ReactionCore.Events.info "publishing account", accountId
      return ReactionCore.Collections.Accounts.find accountId, 'userId': @userId
  return
###
# tags
###
Meteor.publish "Tags", ->
  return Tags.find(shopId: ReactionCore.getShopId())

###
# shipping
###
Meteor.publish "Shipping", ->
  return Shipping.find(shopId: ReactionCore.getShopId())

###
# taxes
###
Meteor.publish "Taxes", ->
  return Taxes.find(shopId: ReactionCore.getShopId())

###
# discounts
###
Meteor.publish "Discounts", ->
  return Discounts.find(shopId: ReactionCore.getShopId())
