# Define register method
# this will get inserted by fixtures on fresh package install
#
ReactionCore.registerPackage = (packageInfo) ->
  ReactionRegistry.Packages[packageInfo.name] = packageInfo

# Register core packages
ReactionCore.registerPackage
  name: 'core'
  autoEnable: true
  settings:
    public:
      allowGuestCheckout: true
    mail:
      user: ""
      password: ""
      host: "localhost"
      port: "25"
  # app registry
  registry: [
    {
      route: "dashboard"
      provides: 'dashboard'
      label: 'Core'
      description: 'Reaction Commerce Core'
      icon: 'fa fa-th'
      cycle: 1
      container: "dashboard"
    }
    {
      route: "dashboard"
      provides: 'shortcut'
      label: 'Dashboard'
      icon: 'fa fa-th'
      cycle: 1
    }
    {
      route: "dashboard"
      label: 'Dashboard'
      provides: 'console'
    }
    {
      route: "dashboard/settings/shop"
      provides: 'settings'
      icon: "fa fa-cog fa-2x fa-fw"
      container: 'dashboard'
    }
    # orders
    {
      route: "dashboard/orders"
      provides: 'dashboard'
      label: 'Orders'
      description: 'Fulfill your orders'
      icon: 'fa fa-sun-o'
      cycle: 3
      container: "orders"
    }
    {
      route: "dashboard/orders"
      provides: 'shortcut'
      label: 'Orders'
      description: 'Fulfill your orders'
      icon: 'fa fa-sun-o'
      cycle: 3
    }
    {
      route: "dashboard/orders"
      label: 'Orders'
      provides: 'console'
    }
    # order widgets
    {
      template: "coreOrderWidgets"
      provides: 'widget'
      route: "dashboard/orders"
    }
    # products
    {
      route: 'createProduct'
      label: 'Create'
      icon: 'fa fa-plus'
      provides: 'shortcut'
    }
    # users
    {
      route: 'dashboard/accounts'
      label: 'Members'
      description: 'Manage your user accounts'
      icon: 'fa fa-users'
      provides: 'dashboard'
      cycle: 3
    }
    # members / users
    {
      route: 'dashboard/accounts'
      label: 'Members'
      provides: 'console'
    }
    # account profiles
    {
      route: 'account/profile'
      label: 'Profile'
      icon: 'fa fa-info-circle'
      provides: 'userAccountDropdown'
    }
  ]
  # permissions
  permissions: [
    {
      label: "Promotions"
      permission: "dashboard/promotions"
      group: "Shop Management"
    }
    {
      label: "Products"
      permission: "dashboard/products"
      group: "Shop Content"
    }
    {
      label: "Shop Settings"
      permission: "dashboard/settings"
      group: "Shop Settings"
    }
    {
      label: "Members"
      permission: "dashboard/members"
      group: "Shop Settings"
    }
    {
      label: "Orders"
      permission: "dashboard/orders"
      group: "Shop Management"
    }
  ]
