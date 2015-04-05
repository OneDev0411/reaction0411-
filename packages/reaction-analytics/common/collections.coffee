#
# Analytics Events
# eventType: 'pageview', 'event',
#'identify', 'group', 'track', 'page', 'pageview', 'alias', 'ready', 'on', 'once', 'off', 'trackLink', 'trackForm', 'trackClick', 'trackSubmit']

ReactionCore.Collections.AnalyticsEvents = new Meteor.Collection 'AnalyticsEvents'

###
#   Analytics
#   api_key: "UA-XXXXX-X" (this is your tracking ID)
###
ReactionCore.Schemas.ReactionAnalyticsPackageConfig = new SimpleSchema([
  ReactionCore.Schemas.PackageConfig
  {
    "settings.public.segmentio.enabled":
      type: Boolean
      label: "Enabled"
    "settings.public.segmentio.api_key":
      type: String
      label: "Tracking ID"
    "settings.public.google-analytics.enabled":
      type: Boolean
      label: "Enabled"
    "settings.public.google-analytics.api_key":
      type: String
      label: "Tracking ID"
    "settings.public.mixpanel.enabled":
      type: Boolean
      label: "Enabled"
    "settings.public.mixpanel.api_key":
      type: String
      label: "Token"
  }
])
