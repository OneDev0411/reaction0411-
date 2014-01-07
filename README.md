#Reaction
A commerce platform developed with Meteor and following a reactive design pattern.

Reaction is an open source endeavor of [Ongo Works](http://ongoworks.com). We welcome (and need) contributors, issues, comments!

###Core ideas:


* Fast, simple and easy to use for end users as well as store owners.
* A focus on marketing - it's easy to have products, order processing and customer records. Translating that to conversions and traffic are often the difficult component.
* Limited separation of administrative functionality and "front end". Same template should be used to edit/create/read views.
* Statistics / event tracking should be built in from the beginning throughout
* As modular as possible so that any package can be customized/overwritten - i.e.: need a special order processing process, then override/extend the default
* Core packages to enable site should be a simple and generic as possible, layering complexity by adding packages through a package store ('app store') approach
* Common marketing and SEO practices should be fundamental core features
* UI/UX should be as intuitive as possible, rethinking traditional methods (i.e. inline editing vs forms)
* Pages/routes only used when user would potentially share/bookmark
* Realtime synchronization across platforms/browsers
* Cross platform, responsive focus - should work well natively, without native apps.
* Upgrade paths from existing commerce platforms (Magento, Shopify, BigCommerce)
* Developer friendly. Commercial package and theme development encouraged. Contributors should be rewarded.

###Roadmap:
**Current status: Unstable, with HEAVY ongoing development!**

Only good for contributing/observing progress right now. Our estimated timeline:

* Catalog/Product Management - functional now
* Cart - functional now
* Checkout (with shipping/payment methods):
	* Alpha: Late January 2014  (search, shipping calc, payments)
	* Beta: Late February 2014 (promotions, hero, cms)
* Complete PaaS solution:
	* Release Candidate 1: Q1 2014 (social tracking, seo, mixed rate shipping)
	* Release Candidate 2: Q1 2014 (migration tools, multiple themes, theme editor)


Please check our [Trello board for current progress](https://trello.com/b/aGpcYS5e/development)

Usually, we have playground here: [Demo/test site](http://demo.reactioncommerce.com)

* Use admin1@ongoworks.com / ongo1 to test dashboard/admin/editing.

---
##Prerequisites
Install [git](https://github.com/blog/1510-installing-git-from-github-for-mac) command line and [node.js](http://nodejs.org/)

##Installation
    curl https://install.meteor.com | /bin/sh
    sudo -H npm install -g meteorite
    git clone https://github.com/ongoworks/reaction.git
    cd reaction
    mrt update
## Configuration
Create [settings/dev.json](https://github.com/ongoworks/reaction/blob/master/settings/dev.sample.json) and populate, or copy dev.sample.json (will work with empty configuration values)

	cp settings/dev.sample.json settings/dev.json

Example configuration file

	{
	  "baseUrl": "http://localhost:3000",
	  "filepickerApiKey": "__KEY__",
	  "googleAnalyticsProperty": "__KEY__",
	  "facebook": {
	    "secret": "__SECRET__"
	  },
	  "public": {
	    "isDebug": true,
	    "facebook": {
	      "appId": "__APP_ID__"
	    }
	  }
	}



##Startup
	./bin/reset & ./bin/run

./bin/reset will restart server, and give you a fresh test dataset from settings/dev.json

Browse to [http://localhost:3000](http://localhost:3000) and you should see Reaction running.



##Deploying
To deploy to a [meteor.com hosted site ](http://docs.meteor.com/#deploying)

	./bin/deploy -P demo.json demo.meteor.com


---
#Development
---

See [Meteor Docs](http://docs.meteor.com) for introduction to [Meteor](http://meteor.com).

Read [Meteor Style Guide](https://github.com/meteor/meteor/wiki/Meteor-Style-Guide) for format and style of contributions.

Our core is being built with a preference for Coffeescript + LESS.

We are always using latest full release of all packages.

Packages should be able to run independently, whenever possible but many of the core packages will have dependancies on the reaction-shop package.

At this time, for development ease, we are committing all reaction-* packages in this main repo but as we approach an Alpha release, these will be moved to individual package repos and published on the Meteor package manager. Tests will be added when they are moved to their own repos.

#Dashboard
Add packages to the reaction dashboard by adding **register.coffee**

	Meteor.app.packages.register(
	  name: "reaction-helloworld"
	  depends: [] #reaction packages
	  label: "HelloWorld"
	  description: "Example Reaction Package"
	  icon: "fa fa-globe fa-5x"
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

#Roles/Permissions System

##Roles
We use https://github.com/alanning/meteor-roles for providing roles.
Now only "admin" role using for providing user do everything in system.

##Permissions
Shop has owner, which determine by "ownerId" field in Shop collection.
To check if user has owner access:
``` coffeescript
# on Client: for current user
Meteor.app.hasOwnerAccess()
# handlebars
{{#if hasOwnerAccess}}{{/if}}

# on Server: for some shop (current if not defined) and some userId (current if not defined)
Meteor.app.hasOwnerAccess(shop, userId)
```
Shop has members, which can be admin and have permissions
To check if user has some permissions:
``` coffeescript
# on Client: for current user, where "permissions" is string or [string]
Meteor.app.hasPermission(permissions)
# handlebars
{{#if hasShopPermission permissions}}{{/if}}

# on Server: for some shop (current if not defined) and some userId (current if not defined), where "permissions" is string or [string]
Meteor.app.hasPermission(permissions, shop, userId)
```

