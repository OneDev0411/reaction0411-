###
# Fixtures is a global server object that it can be reused in packages
# assumes collection data in reaction-core/private/data, optionally jsonFile
# use jsonFile when calling from another package, as we can't read the assets from here
###
PackageFixture = ->
  # loadData inserts json into collections on app initilization
  # ex:
  #   jsonFile =  Assets.getText("private/data/Shipping.json")
  #   Fixtures.loadData ReactionCore.Collections.Shipping, jsonFile
  #
  loadData: (collection, jsonFile) ->
    #check collection, ReactionCore.Schemas[collection._name]
    check jsonFile, Match.Optional(String)
    if collection.find().count() > 0 then return

   # load fixture data
    ReactionCore.Events.info "Loading fixture data for "+collection._name
    unless jsonFile
      json = EJSON.parse Assets.getText("private/data/"+collection._name+".json")
    else
      json = EJSON.parse jsonFile

    # loop through and import
    for item, index in json
      collection._collection.insert item, (error, result) ->
        if error
          ReactionCore.Events.info (error + "Error adding " + index + " items to " + collection._name)
          return false
    if index > 0
      ReactionCore.Events.info ("Success adding " + index + " items to " + collection._name)
      return
    else
      ReactionCore.Events.info ("No data imported to " + collection._name)
      return

  #
  # updates package settings, accepts json string
  # example:
  #  Fixtures.loadSettings Assets.getText("settings/reaction.json")
  #
  # This basically "hardcodes" all the settings. You can change them
  # via admin etc for the session, but when the server restarts they'll
  # be restored back to the supplied json
  #
  loadSettings: (json) ->
    check json, String
    validatedJson = EJSON.parse json
    # warn if this isn't an array of packages
    unless _.isArray(validatedJson[0])
      ReactionCore.Events.warn "Load Settings is not an array. Failed to load settings."
      return
    # loop through and import
    for pkg in validatedJson
      for item in pkg
        exists = ReactionCore.Collections.Packages.findOne('name': item.name)
        if exists
          result = ReactionCore.Collections.Packages.upsert(
            { 'name': item.name }, {
              $set:
                'settings': item.settings
                'enabled': item.enabled
            },
            multi: true
            upsert: true
            validate: false)
          ReactionCore.Events.info "loaded local package data: " + item.name
      #   return
      # return

  #
  # loadI18n for defined shops language source json
  # ex: Fixtures.loadI18n()
  #
  loadI18n: (collection = ReactionCore.Collections.Translations) ->
    languages = []
    return if collection.find().count() > 0
    # load languages from shops array
    shop = ReactionCore.Collections.Shops.findOne()
    # find every file in private/data/i18n where <i18n>.json
    ReactionCore.Events.info "Loading fixture data for " + collection._name
    # ensures that a language file is loaded if all translations are missing
    unless shop?.languages then shop.languages = [{'i18n':'en'}]

    for language in shop.languages
      json = EJSON.parse Assets.getText("private/data/i18n/" + language.i18n + ".json")

      for item in json
        collection._collection.insert item, (error, result) ->
          if error
            ReactionCore.Events.info (error + "Error adding " + language.i18n + " items to " + collection._name)
            return
        ReactionCore.Events.info ("Success adding "+ language.i18n + " to " + collection._name)
    return


# instantiate fixtures
@Fixtures = new PackageFixture

# helper for creating admin users
getDomain = (url) ->
  unless url then url = process.env.ROOT_URL
  domain = url.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i)[1]
  return domain

###
# Three methods to create users default (empty db) admin user
###
createDefaultAdminUser = ->
  # options from set env variables
  options = {}
  options.email = process.env.METEOR_EMAIL #set in env if we want to supply email
  options.username = process.env.METEOR_USER
  options.password = process.env.METEOR_AUTH
  domain = getDomain()

  # options from mixing known set ENV production variables
  if process.env.METEOR_EMAIL
    url = process.env.MONGO_URL #pull from default db connect string
    options.username = "Administrator"
    unless options.password then options.password = url.substring(url.indexOf("/") + 2,url.indexOf("@")).split(":")[1]
    ReactionCore.Events.warn ("\nIMPORTANT! DEFAULT USER INFO (ENV)\n  EMAIL/LOGIN: " + options.email + "\n  PASSWORD: " + options.password + "\n")
  else
    # random options if nothing has been set
    options.username = Meteor.settings?.reaction?.METEOR_USER || "Administrator"
    options.password = Meteor.settings?.reaction?.METEOR_AUTH || Random.secret(8)
    options.email = Meteor.settings?.reaction?.METEOR_EMAIL || Random.id(8).toLowerCase() + "@" + domain
    ReactionCore.Events.warn ("\nIMPORTANT! DEFAULT USER INFO (RANDOM)\n  EMAIL/LOGIN: " + options.email + "\n  PASSWORD: " + options.password + "\n")
  # newly created admin user
  accountId = Accounts.createUser options
  # add default roles and update shop with admin user
  Roles.addUsersToRoles accountId, ['manage-users','owner','admin']
  shopId = Shops.findOne()._id
  Shops.update shopId,
    $set:
      ownerId: accountId
    $addToSet:
      emails: {'address': options.email, 'verified': true}
      domains: Meteor.settings.ROOT_URL
    $push:
      members:
        isAdmin: true
        userId: accountId
        permissions: [
            "dashboard/customers",
            "dashboard/products",
            "dashboard/settings",
            "dashboard/settings/account",
            "dashboard/orders"
            ]

###
# load core fixture data
###
loadFixtures = ->
  # Load data from json files
  Fixtures.loadData ReactionCore.Collections.Shops
  Fixtures.loadData ReactionCore.Collections.Products
  Fixtures.loadData ReactionCore.Collections.Tags
  Fixtures.loadI18n ReactionCore.Collections.Translations

  # if ROOT_URL update shop domain
  # for now, we're assuming the first domain is the primary
  currentDomain = Shops.findOne().domains[0]
  if currentDomain isnt getDomain()
    ReactionCore.Events.info "Updating domain to " + getDomain()
    Shops.update({domains:currentDomain},{$set:{"domains.$":getDomain()}})


  # Load data from settings/json files
  unless Accounts.loginServiceConfiguration.find().count()
    if Meteor.settings.public?.facebook?.appId
      Accounts.loginServiceConfiguration.insert
        service: "facebook",
        appId: Meteor.settings.public.facebook.appId,
        secret: Meteor.settings.facebook.secret

  # Loop through ReactionRegistry.Packages object, which now has all packages added by
  # calls to register
  # removes package when removed from meteor, retriggers when package added
  unless ReactionCore.Collections.Packages.find().count() is Object.keys(ReactionRegistry.Packages).length
    _.each ReactionRegistry.Packages, (config, pkgName) ->
      Shops.find().forEach (shop) ->
        ReactionCore.Events.info "Initializing "+ pkgName
        ReactionCore.Collections.Packages.upsert {shopId: shop._id, name: pkgName},
          $setOnInsert:
            enabled: !!config.autoEnable
            settings: config.settings
            registry: config.registry
            shopPermissions: config.permissions
            services: config.services

    # remove unused packages
    Shops.find().forEach (shop) ->
      ReactionCore.Collections.Packages.find().forEach (pkg) ->
        unless _.has(ReactionRegistry.Packages, pkg.name)
          ReactionCore.Events.info ("Removing "+ pkg.name)
          ReactionCore.Collections.Packages.remove {shopId: shop._id, name: pkg.name}

  # create default admin user account
  createDefaultAdminUser() unless Meteor.users.find().count()

###
# Execute start up fixtures
###
Meteor.startup ->
  loadFixtures()

  # notifiy that we're done with initialization
  ReactionCore.Events.info "Reaction Commerce initialization finished. "
