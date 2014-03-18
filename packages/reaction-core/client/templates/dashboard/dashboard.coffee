Template.dashboard.helpers
  isVisible: ->
    Session.get("dashboard")

  Package: ->
    # package view is aware of Package / Context / Route / Permissions
    #
    # currentContext = Session.get('currentDashboard')
    currentPackage = Session.get 'currentPackage'
    unless currentPackage? then Session.set 'currentPackage', "reaction-commerce"
    packageInfo = Meteor.app.packages[currentPackage]
    packageInfo

  dependencies: ->
    currentPackageDepends  = Meteor.app.packages["reaction-commerce"].depends
    dependencies = []
    Packages.find().forEach (packageConfig) ->
      packageInfo = Meteor.app.packages[packageConfig.name]
      if _.intersection(currentPackageDepends, packageInfo?.provides).length
        dependencies.push(_.extend(packageConfig, packageInfo))
    dependencies

Template.dashboard.events
  'click .dashboard-navbar-package': (event, template) ->
    Session.set "currentPackage", @.name
    if @.overviewRoute?
      event.preventDefault()
      Router.go(@.overviewRoute)


  'click .next': (event, template) ->
      owl.trigger('owl.next')

  'click .prev': (event, template) ->
      owl.trigger('owl.prev')

Template.dashboard.rendered = ->
  $(".dashboard").owlCarousel
    lazyload: true
    # items: 6;
    # itemsScaleUp: true;
    navigation: false;
    pagination: false;
    # itemsCustom : [
    #     [0, 2],
    #     [450, 4],
    #     [600, 7],
    #     [700, 9],
    #     [1000, 10],
    #     [1200, 12],
    #     [1400, 13],
    #     [1600, 15]
    #   ]

###
# dashboard nav bar
###

Template.dashboardNavBar.helpers
  packages: ->
    packageConfigs = []
    existingPackages = Packages.find().fetch()
    for packageConfig in existingPackages
      packageInfo = Meteor.app.packages[packageConfig.name]
      if packageInfo?.hasWidget
        packageConfigs.push(_.extend(packageConfig, packageInfo))
    packageConfigs

  isActive: ->
    if @.name is Session.get 'currentPackage' then return "active"

