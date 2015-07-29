###
#
# Reaction Spacebars helpers
# See: http://docs.meteor.com/#/full/template_registerhelper
#
###

#
# monthOptions
# returns momentjs months formatted for autoform
#
Template.registerHelper "monthOptions", () ->
  monthOptions = [{value: "", label: "Choose month"}]
  months = moment.months()
  for month, index in months
    monthOptions.push value: index + 1, label: month
  return monthOptions

#
# yearOptions
# returns array of years, formatted for autoform
#
Template.registerHelper "yearOptions",  () ->
  yearOptions = [{ value: "", label: "Choose year" }]
  year = new Date().getFullYear()
  for x in [1...9] by 1
    yearOptions.push { value: year , label: year}
    year++
  return yearOptions

#
# timezoneOptions
# returns array of momentjs timezones formatted for autoform
#
Template.registerHelper "timezoneOptions", () ->
  timezoneOptions = [{value: "", label: "Choose timezone"}]
  timezones = moment.tz.names()
  for timezone, index in timezones
    timezoneOptions.push value: timezone, label: timezone
  return timezoneOptions

#
# gets current cart billing address / payment name
#
Template.registerHelper "cartPayerName",  ->
    Cart.findOne()?.payment?.address?.fullName

#
# return path for route
#
Template.registerHelper "pathForSEO", (path, params) ->
  if this[params]
    return "/"+ path + "/" + this[params]
  else
    return Router.path path,this

#
# displayName
#
# params user - optional a user object defaults to current user
# returns string user name
#
Template.registerHelper "displayName", (user) ->
  userSub = Meteor.subscribe "UserProfile", user?._id || Meteor.userId()
  userId = user?._id || Meteor.userId()
  if userSub.ready()
    user = Meteor.users.findOne(userId) unless user
    # every social channel is different
    # legacy profile name
    if user and user.profile and user.profile.name
      return user.profile.name
    # meteor user name
    else if user and user.username
      return user.username
    # service names
    if user and user.services
      username = switch
        when user.services.twitter then user.services.twitter.name
        when user.services.facebook then user.services.facebook.name
        when user.services.instagram then user.services.instagram.name
        when user.services.pinterest then user.services.pinterest.name
        else "Guest"

#
# general helper user name handling
# TODO: needs additional validation all use cases
# returns first word in profile name
#
Template.registerHelper "fName", (user) ->
  userSub = Meteor.subscribe "UserProfile", user?._id || Meteor.userId()
  if userSub.ready()
    user = Meteor.users.findOne() unless user
    # every social channel is different
    # legacy profile name
    if user and user.profile and user.profile.name
      return user.profile.name.split(" ")[0]
    else if user and user.username
      return user.username.name.split(" ")[0]

    # service names
    if user and user.services
      username = switch
        when user.services.twitter then user.services.twitter.first_name
        when user.services.facebook then user.services.facebook.first_name
        when user.services.instagram then user.services.instagram.first_name
        when user.services.pinterest then user.services.pinterest.first_name
        else "Guest"

#
# decamelSpace
#
Template.registerHelper "camelToSpace", (str) ->
  downCamel = str.replace(/\W+/g, "-").replace /([a-z\d])([A-Z])/g, "$1 $2"
  return downCamel.toLowerCase()

#
# upperCase or lowerCase string
#
Template.registerHelper "toLowerCase", (str) ->
  return str.toLowerCase()

Template.registerHelper "toUpperCase", (str) ->
  return str.toUpperCase()

Template.registerHelper "capitalize", (str) ->
  return str.charAt(0).toUpperCase() + str.slice(1)

#
# camelCase string
#
Template.registerHelper "toCamelCase", (str) ->
  return str.toCamelCase()

###
# Methods for the reaction permissions
# https://github.com/ongoworks/reaction#rolespermissions-system
# use: {{hasPermissions admin userId}}
###
Template.registerHelper "hasPermission", (permissions, userId) ->
  check permissions, Match.OneOf(String, Object)
  if typeof(userId) is 'object' then userId = Meteor.userId()
  return ReactionCore.hasPermission permissions, userId

Template.registerHelper "hasOwnerAccess", ->
  ReactionCore.hasOwnerAccess()

Template.registerHelper "hasAdminAccess", ->
  ReactionCore.hasAdminAccess()

Template.registerHelper "hasDashboardAccess", ->
  return ReactionCore.hasDashboardAccess()

Template.registerHelper "allowGuestCheckout", ->
  packageRegistry = ReactionCore.Collections.Packages.findOne shopId: ReactionCore.getShopId(), name: 'core'
  allowGuest = packageRegistry?.settings?.public?.allowGuestCheckout || false
  return allowGuest

###
# activeRouteClass
# return "active" if current path
###
Template.registerHelper "activeRouteClass", ->
  args = Array::slice.call(arguments, 0)
  args.pop()
  active = _.any(args, (name) ->
    location.pathname is Router.path(name)
  )
  return active and "active"

###
# siteName()
# return site name
###
Template.registerHelper "siteName", ->
  return Shops.findOne()?.name

###
# methods to return cart calculated values
# cartCount, cartSubTotal, cartShipping, cartTaxes, cartTotal
# are calculated by a transformation on the collection
# and are available to use in template as cart.xxx
# in template: {{cart.cartCount}}
# in code: ReactionCore.Collections.Cart.findOne().cartTotal()
###
Template.registerHelper "cart", () ->
  # return true if there is an issue with the user's cart and we should display the warning icon
  showCartIconWarning: ->
    if @.showLowInventoryWarning()
        return true
    return false

  # return true if any item in the user's cart has a low inventory warning
  showLowInventoryWarning: ->
    storedCart = Cart.findOne()
    if storedCart?.items
      for item in storedCart?.items
        if item.variants?.inventoryPolicy and item.variants?.lowInventoryWarningThreshold
          if (item.variants?.inventoryQuantity <= item.variants.lowInventoryWarningThreshold)
            return true
    return false

  # return true if item variant has a low inventory warning
  showItemLowInventoryWarning: (variant) ->
    if variant?.inventoryPolicy and variant?.lowInventoryWarningThreshold
      if (variant?.inventoryQuantity <= variant.lowInventoryWarningThreshold)
        return true
    return false


###
#  General helpers for template functionality
###

###
# conditional template helpers
# example:  {{#if condition status "eq" ../value}}
###
Template.registerHelper "condition", (v1, operator, v2, options) ->
  switch operator
    when "==", "eq"
      v1 is v2
    when "!=", "neq"
      v1 isnt v2
    when "===", "ideq"
      v1 is v2
    when "!==", "nideq"
      v1 isnt v2
    when "&&", "and"
      v1 and v2
    when "||", "or"
      v1 or v2
    when "<", "lt"
      v1 < v2
    when "<=", "lte"
      v1 <= v2
    when ">", "gt"
      v1 > v2
    when ">=", "gte"
      v1 >= v2
    else
      throw "Undefined operator \"" + operator + "\""

Template.registerHelper "orElse", (v1, v2) ->
  return v1 || v2

Template.registerHelper "key_value", (context, options) ->
  result = []
  _.each context, (value, key, list) ->
    result.push
      key: key
      value: value
  return result

###
# Convert new line (\n\r) to <br>
# from http://phpjs.org/functions/nl2br:480
###
Template.registerHelper "nl2br", (text) ->
  nl2br = (text + "").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, "$1" + "<br>" + "$2")
  new Spacebars.SafeString(nl2br)

###
# format an ISO date using Moment.js
# http://momentjs.com/
# moment syntax example: moment(Date("2011-07-18T15:50:52")).format("MMMM YYYY")
# usage: {{dateFormat creation_date format="MMMM YYYY"}}
###
Template.registerHelper "dateFormat", (context, block) ->
  if window.moment
    f = block.hash.format or "MMM DD, YYYY hh:mm:ss A"
    return moment(context).format(f) #had to remove Date(context)
  else
    return context #  moment plugin not available. return data as is.
  return

###
# general helper for plurization of strings
# returns string with 's' concatenated if n = 1
# TODO: adapt to, and use i18n
###
Template.registerHelper "pluralize", (n, thing) ->
  # fairly stupid pluralizer
  if n is 1
    "1 " + thing
  else
    n + " " + thing + "s"

###
# general helper to return 'active' when on current path
# returns string\
# handlebars: {{active 'route'}}
###

#Determine if current link should be active
Template.registerHelper "active", (path) ->
  # Get the current path for URL
  current = Router.current()
  routeName = current and current.route.getName()
  if routeName is path
    return "active"
  else
    return ""

###
# general helper to return 'active' when on current path
# returns string
# handlebars: {{navLink 'projectsList' 'icon-edit'}}
###
Template.registerHelper "navLink", (page, icon) ->
  ret = "<li "
  ret += "class='active'"  if Meteor.Router.page() is page
  ret += "><a href='" + Meteor.Router.namedRoutes[page].path + "'><i class='" + icon + " icon-fixed-width'></i></a></li>"
  return new Spacebars.SafeString(ret)

###
#
# reactionApps
#
#   provides="<where matching registry provides is this >"
#   enabled=true <false for disabled packages>
#   context= true filter templates to current route
#
# returns matching package registry objects
#
#  TODO:
#   - reintroduce a dependency context
#   - introduce position,zones #148
#   - is it better to get all packages once and filter in code
#     and possibly have some cache benefits down the road,
#     or to retrieve what is requested and gain the advantage of priviledged,
#     unnecessary data not retrieved with the cost of additional requests.
#   - context filter should be considered experimental
#
###
Template.registerHelper "reactionApps", (options) ->
  packageSubscription = Meteor.subscribe "Packages"

  if packageSubscription.ready()
    unless options.hash.shopId then options.hash.shopId = ReactionCore.getShopId()
    reactionApps = []
    filter = {}
    registryFilter = {}
    # any registry property, name, enabled can be used as filter
    for key, value of options.hash
      unless key is 'enabled' or key is 'name' or key is 'shopId'
        filter['registry.' + key] = value #for query
        registryFilter[key] = value #for registry filter
      else
        filter[key] = value #handle top level filters

    # we only need these fields (filtered for user, all available to admin)
    fields =
      'enabled': 1
      'registry': 1
      'name': 1

    # fetch filtered package
    reactionPackages = ReactionCore.Collections.Packages.find(filter, fields).fetch()

    # really, this shouldn't ever happen
    unless reactionPackages then throw new Error("Packages not loaded.")

    # filter packages
    # this isn't as elegant as one could wish, review, refactor?

    #  filter name and enabled as the package level filter
    if filter.name and filter.enabled
      packages = (pkg for pkg in reactionPackages when pkg.name is filter.name and pkg.enabled is filter.enabled)
    else if filter.name
      packages = (pkg for pkg in reactionPackages when pkg.name is filter.name)
    else if filter.enabled
      packages = (pkg for pkg in reactionPackages when pkg.enabled is filter.enabled)
    else
      packages = (pkg for pkg in reactionPackages)

    # filter and reduce, format registry objects
    # checks to see that all registry filters are applied to the registry objects
    # and pushes to reactionApps
    for app in packages
      for registry in app.registry
        match = 0
        for key, value of registryFilter
          if registry[key] is value
            match += 1
          if match is Object.keys(registryFilter).length
            registry.name = app.name
            # skip false registry entries, even if pkg is enabled
            unless registry.enabled is false
              registry.enabled = registry.enabled || app.enabled
              registry.packageId = app._id
              reactionApps.push registry

    #
    # TODO: add group by provides, sort by cycle, enabled
    #

    # make sure they are unique,
    # add priority for default sort
    reactionApps = _.uniq(reactionApps)
    for app, index in reactionApps
      reactionApps[index].priority = index unless app.priority
    # need to sort after?
    return reactionApps
