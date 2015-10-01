Packages = ReactionCore.Collections.Packages;

/**
 *  Packages contains user specific configuration
 *  @summary  package publication settings, filtered by permissions
 *  @param {Object} shopCursor - current shop object
 *  @returns {Object} packagesCursor - current packages for shop
 */

Meteor.publish("Packages", function(shopCursor) {
  check(shopCursor, Match.Optional(Object));
  shop = shopCursor || ReactionCore.getCurrentShop(this);
  // we should always have a shop
  if (shop) {
    // if admin user, return all shop properties
    if (Roles.userIsInRole(this.userId, ["dashboard", "owner", "admin"],
        ReactionCore.getShopId(this) || Roles.userIsInRole(this.userId, [
          "owner", "admin"
        ], Roles.GLOBAL_GROUP))) {
      return Packages.find({
        shopId: shop._id
      });
    }
    // else we'll just return without private settings
    return Packages.find({
      shopId: shop._id
    }, {
      fields: {
        "shopId": true,
        "name": true,
        "enabled": true,
        "registry": true,
        "layout": true,
        "settings.public": true
      }
    });
  }
  return [];
});
