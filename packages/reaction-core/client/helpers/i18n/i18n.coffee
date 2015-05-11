###################################################################################
#  i18next http://i18next.com/  Implementation for Reaction Commerce
#
#  usage - in template: {{i18n 'cartDrawer.empty'}}
#  usage - inline tag: <td data-i18n='cartSubTotals.items'>
#  usage - reference:  <thead data-i18n>cartSubTotals.head</thead>
#  usage - alerts Alerts.add "Message!", "danger", placement: "productDetail", i18n_key: "productDetail.outOfStock"
#
#  all translations should go in private/data/i18n/*.json, where they get imported into `Translations`
#  language keys fallback to English, and then template text.
#
###################################################################################

###
#
# get i18n messages for  updating autoform labels from simple schema
#
###
getLabelsFor = (schema, name) ->
  labels = {}
  for fieldName in schema._schemaKeys
    i18n_key = name.charAt(0).toLowerCase() + name.slice(1) + "." + fieldName.split(".$").join("")
    translation = i18n.t(i18n_key)
#    console.debug "schema: #{name} fieldName: #{fieldName} i18n_key: #{i18n_key} translation: #{translation}"
    if new RegExp('string').test(translation) isnt true and translation isnt i18n_key
      # schema._schema[fieldName].label =  i18n.t(i18n_key)
      labels[fieldName] = translation
  return labels

###
# get i18n messages for autoform messages
# currently using a globalMessage namespace only
#
# TODO: implement messaging hierarchy from simple-schema
#
# (1) Use schema-specific message for specific key
# (2) Use schema-specific message for generic key
# (3) Use schema-specific message for type
#
###
getMessagesFor = (schema, name) ->
  messages = {}
  for message of SimpleSchema._globalMessages
    i18n_key = "globalMessages" + "." + message
    translation = i18n.t(i18n_key)

    if new RegExp('string').test(translation) isnt true and translation isnt i18n_key
      messages[message] = translation
  return messages

###
#  set language and autorun on change of language
#  initialize i18n and load data resources for the current language and fallback 'EN'
#
###

@i18nextDep = new Tracker.Dependency()

Meteor.startup ->
  # set language
  Session.set "language", i18n.detectLanguage()

  # set locale
  Meteor.call 'getLocale', (error,result) ->
    if result
      ReactionCore.Locale = result
      ReactionCore.Locale.language = Session.get "language"
      moment.locale(ReactionCore.Locale.language)
    return

  # start the autorun after startup, so that "language" session var is already set
  Tracker.autorun () ->
    ReactionCore.Locale.language = Session.get "language"
    Meteor.subscribe "Translations", ReactionCore.Locale.language, () ->
      resources =  ReactionCore.Collections.Translations.find({},{fields:{_id: 0},reactive:false}).fetch()
      # map multiple translations into i18next format
      resources = resources.reduce (x, y) ->
        x[y.i18n]= y.translation
        return x
      , {}

      i18n.init {
          lng: ReactionCore.Locale.language
          fallbackLng: 'en'
          ns: "core"
          resStore: resources
          # debug: true
        },(t)->
          # update labels and messages for autoform,schemas
          for schema, ss of ReactionCore.Schemas
            ss.labels getLabelsFor(ss, schema)
            ss.messages getMessagesFor(ss, schema)

          #re-init all i18n
          i18nextDep.changed()

          # set document direction class
          if (t('languageDirection') == 'rtl')
            $('html').addClass 'rtl'
          else
            $('html').removeClass 'rtl'

  # reactive translations in all templates
  Template.onRendered () ->
    @autorun () =>
      i18nextDep.depend() #rerun whenever language changes and we re-init $.i18n
      $elements = @$("[data-i18n]")
      $elements.i18n() if typeof $elements.i18n is "function"
      return
    return

  # trigger translations when template are removed
  Template.onDestroyed () ->
    i18nextDep.changed()
    return

###
# i18n helper
# see: http://i18next.com/
# pass the translation key as the first argument
# and the default message as the second argument
#
# ex: {{i18n "accountsTemplate.error" "Invalid Email"}}
###
Template.registerHelper "i18n", (i18n_key, message) ->
  i18nextDep.depend()
  unless i18n_key then Meteor.throw("i18n key string required to translate")
  message = new Handlebars.SafeString(message)
  if i18n.t(i18n_key) is i18n_key # return raw message if no translation found
    console.info "no translation found. returning raw message for:" + i18n_key
    return message
  else # returning translated message, i18n key found.
    return i18n.t(i18n_key)

###
#  return shop /locale specific currency format (ie: $)
###
Template.registerHelper "currencySymbol", () ->
  return ReactionCore.Locale.currency.symbol

###
# return shop /locale specific formatted price
# also accepts a range formatted with " - "
###
Template.registerHelper "formatPrice", (price) ->
  try
    prices = price.split(' - ')
    for actualPrice in prices
      originalPrice = actualPrice
      #TODO Add user services for conversions
      if ReactionCore.Locale?.currency?.exchangeRate then actualPrice = actualPrice * ReactionCore.Locale?.currency?.exchangeRate.Rate
      formattedPrice = accounting.formatMoney actualPrice, ReactionCore.Locale.currency
      price = price.replace(originalPrice, formattedPrice)
  catch
    if ReactionCore.Locale?.currency?.exchangeRate then price = price * ReactionCore.Locale?.currency?.exchangeRate.Rate
    price = accounting.formatMoney price, ReactionCore.Locale?.currency

  return price
