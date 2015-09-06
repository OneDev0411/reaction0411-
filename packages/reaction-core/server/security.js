
/**
* security definitions
*
* The following security definitions use the ongoworks:security package.
* Rules within a single chain stack with AND relationship. Multiple
* chains for the same collection stack with OR relationship.
* See https://github.com/ongoworks/meteor-security
*
* It's important to note that these security rules are for inserts,
* updates, and removes initiated from untrusted (client) code.
* Thus there may be other actions that certain roles are allowed to
* take, but they do not necessarily need to be listed here if the
* database operation is executed in a server method.
*/


/*
* Assign to some local variables to keep code
* short and sweet
*/
var Cart = ReactionCore.Collections.Cart;

var Discounts = ReactionCore.Collections.Discounts;

var Media = ReactionCore.Collections.Media;

var Orders = ReactionCore.Collections.Orders;

var Packages = ReactionCore.Collections.Packages;

var Products = ReactionCore.Collections.Products;

var Shipping = ReactionCore.Collections.Shipping;

var Shops = ReactionCore.Collections.Shops;

var Tags = ReactionCore.Collections.Tags;

var Taxes = ReactionCore.Collections.Taxes;

var Translations = ReactionCore.Collections.Translations;


/*
 * Define some additional rule chain methods
 */

Security.defineMethod('ifShopIdMatches', {
  fetch: [],
  deny: function(type, arg, userId, doc) {
    return doc.shopId !== ReactionCore.getShopId();
  }
});

Security.defineMethod('ifShopIdMatchesThisId', {
  fetch: [],
  deny: function(type, arg, userId, doc) {
    return doc._id !== ReactionCore.getShopId();
  }
});

Security.defineMethod('ifFileBelongsToShop', {
  fetch: [],
  deny: function(type, arg, userId, doc) {
    return doc.metadata.shopId !== ReactionCore.getShopId();
  }
});

Security.defineMethod('ifUserIdMatches', {
  fetch: [],
  deny: function(type, arg, userId, doc) {
    return (userId && doc.userId && doc.userId !== userId) || (doc.userId && !userId);
  }
});

Security.defineMethod('ifUserIdMatchesProp', {
  fetch: [],
  deny: function(type, arg, userId, doc) {
    return doc[arg] !== userId;
  }
});

Security.defineMethod('ifSessionIdMatches', {
  fetch: [],
  deny: function(type, arg, userId, doc) {
    return doc.sessionId !== ReactionCore.sessionId;
  }
});

/**
 * Define all security rules
 */

/**
 * admin security
 * Permissive security for users with the 'admin' role
 */

Security.permit(['insert', 'update', 'remove']).collections([Products, Tags, Translations, Discounts, Taxes, Shipping, Orders, Packages]).ifHasRole({
  role: 'admin',
  group: ReactionCore.getShopId()
}).ifShopIdMatches().exceptProps(['shopId']).apply();


/*
 * Permissive security for users with the 'admin' role for FS.Collections
 */

Security.permit(['insert', 'update', 'remove']).collections([Media]).ifHasRole({
  role: ['admin', 'owner', 'createProduct'],
  group: ReactionCore.getShopId()
}).ifFileBelongsToShop().apply();


/*
 * Users with the 'admin' or 'owner' role may update and
 * remove their shop but may not insert one.
 */

Shops.permit(['update', 'remove']).ifHasRole({
  role: ['admin', 'owner'],
  group: ReactionCore.getShopId()
}).ifShopIdMatchesThisId().apply();


/*
 * Users with the 'admin' or 'owner' role may update and
 * remove products, but createProduct allows just for just a product editor
 */

Products.permit(['insert', 'update', 'remove']).ifHasRole({
  role: ['createProduct'],
  group: ReactionCore.getShopId()
}).ifShopIdMatchesThisId().apply();


/*
 * Users with the 'owner' role may remove orders for their shop
 */

Orders.permit('remove').ifHasRole({
  role: 'owner',
  group: ReactionCore.getShopId()
}).ifShopIdMatches().exceptProps(['shopId']).apply();


/*
 * Can update cart from client. Must insert/remove carts using
 * server methods.
 * Can update all session carts if not logged in or user cart if logged in as that user
 * XXX should verify session match, but doesn't seem possible? Might have to move all cart updates to server methods, too?
 */

Cart.permit(['insert', 'update', 'remove']).ifHasRole({
  role: ['anonymous', 'guest'],
  group: ReactionCore.getShopId()
}).ifShopIdMatchesThisId().ifUserIdMatches().ifSessionIdMatches().apply();


/*
 * apply download permissions to file collections
 */
_.each([Media], function(fsCollection) {
  return fsCollection.allow({
    download: function() {
      return true;
    }
  });
});
