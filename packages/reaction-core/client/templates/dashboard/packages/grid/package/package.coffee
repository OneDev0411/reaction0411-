# returns enabled status for this user for specific package
Template.gridPackage.helpers
  # release cycle ribbon
  pkgTypeClass: ->
    pkg = switch
      when @.cycle is 1 then class: "pkg-core-class", text: "Core"
      when @.cycle is 2 then class: "pkg-stable-class", text: "Stable"
      when @.cycle is 3 then class: "pkg-prerelease-class", text: "Testing"
      else class: "pkg-unstable-class", text: "Early"
    return pkg

Template.gridPackage.events
  "click .enablePkg": (event, template) ->
    self = @
    event.preventDefault()
    ReactionCore.Collections.Packages.update template.data.packageId,
      {$set: {enabled: true}}
      , (error, result) ->
        if result is 1
          Alerts.add self.label + i18n.t("gridPackage.pkgEnabled"), "success",
            type: "pkg-enabled-" + self.name
            autoHide: true
          Router.go self.route if self.route
        else if error
         Alerts.add self.label + i18n.t("gridPackage.pkgDisabled"), "warning",
            type: "pkg-enabled-" + self.name
            autoHide: true

  "click .disablePkg": (event, template) ->
    self = @

    # we don't want to disable autoenabled (core) packages
    if self.name is 'core' then return

    # confirm disable
    if confirm("Are you sure you want to disable "+ self.label)
      # update package info
      event.preventDefault()
      ReactionCore.Collections.Packages.update template.data.packageId,
        {$set: {enabled: false}}
        , (error, result) ->
          if result is 1
            Alerts.add self.label + i18n.t("gridPackage.pkgDisabled"), "success",
              type: "pkg-enabled-" + self.name
              autoHide: true
          else if error
            throw new Meteor.Error "error disabling package", error
    return

  "click .pkg-settings, click [data-action=showPackageSettings]": (event, template) ->
    event.preventDefault()
    event.stopPropagation()

    Router.go @.route if @.route
