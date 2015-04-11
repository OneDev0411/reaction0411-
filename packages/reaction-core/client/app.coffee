###
# Global reaction shop permissions methods and shop initialization
###
_.extend ReactionCore,
  shopId: null
  isMember: false
  isOwner: null
  isAdmin: null
  userPermissions: []
  shopPermissions: []
  shopPermissionGroups: []
  init: ->
    self = @
    # We want this to auto-update whenever shops or packages change, login/logout, etc.
    Tracker.autorun ->
      domain = Meteor.absoluteUrl().split('/')[2].split(':')[0]
      shop = Shops.findOne domains: domain

      if shop
        self.shopId = shop._id
        # permissions and packages
        permissions = []

        # get current enabled packages
        enabledPackages = ReactionCore.Collections.Packages.find(shopId: self.shopId, enabled: true).fetch()

        # extract package registry permissions
        for pkg in enabledPackages
          if pkg?.shopPermissions
            for shopPermission in pkg.shopPermissions
              permissions.push shopPermission

        self.shopPermissions = _.pluck(permissions, "permission")
        self.shopPermissionGroups = for groupName, groupPermissions of _.groupBy(permissions, "group")
          group: groupName
          permissions: groupPermissions

        # exposes public settings for packages
        for pkg in enabledPackages
          if pkg?.settings?.public
            for setting, value of pkg.settings.public
              ReactionCore[setting] = value

        #XXX probably should use deps to recheck this whenever login/logout?
        self.isOwner = Meteor.userId() is shop.ownerId

        member = _.find shop.members, (member) ->
          member.userId is Meteor.userId()
        if member
          self.isMember = true
          self.isAdmin = member.isAdmin
          self.userPermissions = member.permissions
        else
          self.isMember = false
          self.isAdmin = false
          self.userPermissions = []
      # no shop found
      else
        self.shopId = null
        self.isMember = false
        self.isOwner = null
        self.isAdmin = null
        self.userPermissions = []
        self.shopPermissions = []
        self.shopPermissionGroups = []
  # role checkout
  hasOwnerAccess: ->
    return Roles.userIsInRole(Meteor.user(), "admin") or @isOwner
  # dashboard access
  hasDashboardAccess: ->
    return @isMember or @.hasOwnerAccess()

  # permission check
  hasPermission: (permissions) ->
    return false unless permissions
    permissions = [permissions] unless _.isArray(permissions)
    return @.hasOwnerAccess() or _.intersection(permissions, @userPermissions).length or (@isAdmin and _.intersection(permissions, @shopPermissions).length)
  # returns shop id
  getShopId: ->
    return @shopId
  # return the logged in user's shop if he owns any or if he is an admin -> used in multivendor
  getSellerShopId: (client) ->
    if Roles.userIsInRole(Meteor.userId(), ['owner'])
      return ReactionCore.Collections.Shops.findOne({ownerId: Meteor.userId()})?._id;
    else if Roles.userIsInRole(Meteor.userId(), ['admin'])
      return ReactionCore.Collections.Shops.findOne({'members.isAdmin': true, 'members.userId': Meteor.userId()})?._id;
    return null;

Meteor.startup ->
  # todo: this could grow.. and grow...
  # quick little client safety check
  if (PackageRegistry?) then console.error "Bravely warning you that PackageRegistry should not be exported to client."

  # Ignition.....
  ReactionCore.init()
