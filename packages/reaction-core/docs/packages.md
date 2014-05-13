#Package Development

#Core packages

Clone packages locally, then in your local checkout of the reaction repo

    mrt link-package path/to/foo

Where "path/to/foo" is the path to the local repo of the package you with to work on locally.


# New packages

    mrt create-package [path/to/]foo


See [Meteorite docs](https://github.com/oortcloud/meteorite/) for additional help creating local packages.


##Dashboard
Add packages to the reaction dashboard by adding **register.coffee**

    Meteor.app.packages.register(
      name: "reaction-helloworld"
      depends: [] #reaction packages
      label: "HelloWorld"
      description: "Example Reaction Package"
      icon: "fa fa-globe"
      priority: "2"
      overviewRoute: 'helloworld'
      hasWidget: true
      shopPermissions: [
        {
          label: "HelloWorld"
          permission: "/helloworld"
          group: "Hello World"
        }
    )

Add widgets to dashboard elements by including a template named packagename-widget

    <template name="reaction-helloworld-widget">
        <div> this is a widget that will appear on dashboard</div
    </template>

##Roles/Permissions System

###Roles
We use https://github.com/alanning/meteor-roles for providing roles.
Users with "admin" role are full-permission, site-wide users. Package specific roles can be defined in register.coffee

###Permissions
Shop has owner, which determine by "ownerId" field in Shop collection.

**To check if user has owner access:**

on client: for current user

    Meteor.app.hasOwnerAccess()

on server: for some shop (current if not defined) and some userId (current if not defined)

    Meteor.app.hasOwnerAccess(shop, userId)

in templates: for current user

    {{#if hasOwnerAccess}}{{/if}}

**Shop has members, which can be admin and have permissions**

If member is admin next methods will always return `true`

To check if user has some specific permissions:

on Client: for current user, where "permissions" is string or [string]

    Meteor.app.hasPermission(permissions)

on Server: for some shop (current if not defined) and some userId (current if not defined), where "permissions" is string or [string]

    Meteor.app.hasPermission(permissions, shop, userId)

in templates:

    {{#if hasShopPermission permissions}}{{/if}}


For using shop permissions into some packages you must add it into register directive.
If we add this package then permissions will be available in Shop Accounts Settings.

    Meteor.app.packages.register
     name: 'reaction-commerce-orders'
     provides: ['orderManager']
     label: 'Orders'
     overviewRoute: 'shop/orders'
     hasWidget: false
     shopPermissions: [
       {
         label: "Orders"
         permission: "dashboard/orders"
         group: "Shop Management"
       }
     ]