Packages = ReactionCore.Collections.Packages

Meteor.methods
  ###
  #
  # createShop
  # param String 'userId' optionally create shop for provided userId
  # param Object 'shop' optionally provide shop object to customize
  #
  ###
  createShop: (userId, shop) ->
    check userId, Match.Optional String
    check shop, Match.Optional Object
    currentUser = Meteor.userId()
    userId = userId || Meteor.userId()
    # not using the core methods here,
    unless ReactionCore.hasOwnerAccess()
      throw new Meteor.Error 403, "Access Denied"
    @unblock()

    adminRoles  = Roles.getRolesForUser(currentUser, ReactionCore.getShopId())

    try
      shop =  Factory.create 'shop', shop
      Roles.addUsersToRoles [currentUser, userId], adminRoles, shop._id
      return shop._id

    catch e
      ReactionCore.Events.warn "Failed to createShop", e

    return

  ###
  # determine user's countryCode and return locale object
  ###
  getLocale: ->
    @unblock() #prevent waiting for locale
    result = {}
    ip = this.connection.httpHeaders['x-forwarded-for']

    try
      geo = new GeoCoder(geocoderProvider: "freegeoip")
      countryCode = geo.geocode(ip)[0].countryCode.toUpperCase()

    shop = ReactionCore.Collections.Shops.findOne ReactionCore.getShopId()

    unless shop
      return result

    # local development always returns 'RD' so we default to 'US'
    # unless shop address has been defined
    if !countryCode or countryCode is 'RD'
      if shop.addressBook
        countryCode = shop.addressBook[0].country
      else
        countryCode = 'US'

    try
      result.locale = shop.locales.countries[countryCode]
      result.currency = {}
      # get currency formats for locale, default if none
      # comma string/list can be used, but for now we're only using one result
      localeCurrency = shop.locales.countries[countryCode].currency.split(',')
      for currency in localeCurrency
        if shop.currencies[currency]
          result.currency = shop.currencies[currency]
          if shop.currency isnt currency
            # TODO Add some alternate configurable services like Open Exchange Rate
            rateUrl = "http://rate-exchange.herokuapp.com/fetchRate?from=" + shop.currency + "&to=" + currency
            exchangeRate = HTTP.get rateUrl
            result.currency.exchangeRate = exchangeRate.data
          return result #returning first match.

    return result

  ###
  # determine user's full location for autopopulating addresses
  ###
  locateAddress: (latitude, longitude) ->
    check latitude, Match.Optional(Number)
    check longitude, Match.Optional(Number)

    try
      if latitude? and longitude?
        geo = new GeoCoder()
        address = geo.reverse latitude, longitude
      else
        ip = this.connection.httpHeaders['x-forwarded-for']
        if ip
          geo = new GeoCoder(geocoderProvider: "freegeoip")
          address = geo.geocode ip
    catch error
      # something went wrong; we'll use the default location and
      # log the error on the server
      if latitude? and longitude?
        ReactionCore.Events.info "Error in locateAddress for latitude/longitude lookup (" + latitude + "," + longitude + "):" + error.message
      else
        ReactionCore.Events.info "Error in locateAddress for IP lookup (" + ip + "):" + error.message

    if address?.length
      return address[0]
    else # default location if nothing found is US
      return {
        latitude: null
        longitude: null
        country: "United States"
        city: null
        state: null
        stateCode: null
        zipcode: null
        streetName: null
        streetNumber: null
        countryCode: "US"
      }

  ###
  # method to insert or update tag with hierarchy
  # tagName will insert
  # tagName + tagId will update existing
  # currentTagId will update related/hierarchy
  ###
  updateHeaderTags: (tagName, tagId, currentTagId) ->
    check tagName, String
    check tagId, Match.OneOf(String, null, undefined)
    check currentTagId, Match.Optional(String)

    unless ReactionCore.hasPermission('core')
      throw new Meteor.Error 403, "Access Denied"

    newTag =
      slug: getSlug tagName
      name: tagName

    #new tags
    if tagId #just an update
      Tags.update tagId, {$set:newTag}
      ReactionCore.Events.info "Changed name of tag " + tagId + " to " + tagName
    else # create a new tag
      #prevent duplicate tags by checking for existing
      existingTag = Tags.findOne "name":tagName
      #if a tag already exists with that name
      if existingTag
        if currentTagId
          Tags.update currentTagId, {$addToSet: {"relatedTagIds": existingTag._id}}
          ReactionCore.Events.info 'Added tag "' + existingTag.name + '" to the related tags list for tag ' + currentTagId
        else
          Tags.update existingTag._id, {$set:{"isTopLevel":true}}
          ReactionCore.Events.info 'Marked tag "' + existingTag.name + '" as a top level tag'
      #if a tag with that name does not exist yet
      else
        newTag.isTopLevel = !currentTagId
        newTag.shopId = ReactionCore.getShopId()
        newTag.updatedAt = new Date()
        newTag.createdAt = new Date()
        newTagId = Tags.insert newTag
        ReactionCore.Events.info 'Created tag "' + newTag.name + '"'
        if currentTagId
          Tags.update currentTagId, {$addToSet: {"relatedTagIds": newTagId}}
          ReactionCore.Events.info 'Added tag "' + newTag.name + '" to the related tags list for tag ' + currentTagId
    return;

  removeHeaderTag: (tagId, currentTagId) ->
    check tagId, String
    check currentTagId, String

    unless ReactionCore.hasPermission('core')
      throw new Meteor.Error 403, "Access Denied"

    Tags.update(currentTagId, {$pull: {"relatedTagIds": tagId}})
    # if not in use delete from system
    productCount = Products.find({"hashtags":{$in:[tagId]}}).count()
    relatedTagsCount = Tags.find({"relatedTagIds":{$in:[tagId]}}).count()

    if (productCount is 0) and (relatedTagsCount is 0)
      return Tags.remove(tagId)

  ###
  # Helper method to remove all translations, and reload from jsonFiles
  ###
  flushTranslations: ->
    unless ReactionCore.hasAdminAccess()
      throw new Meteor.Error 403, "Access Denied"

    ReactionCore.Collections.Translations.remove({})
    Fixtures.loadI18n()
    ReactionCore.Events.info Meteor.userId() + " Flushed Translations."
