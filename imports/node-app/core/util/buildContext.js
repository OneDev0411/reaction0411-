import { getHasPermissionFunctionForUser } from "/imports/plugins/core/accounts/server/no-meteor/hasPermission";
import { getShopsUserHasPermissionForFunctionForUser } from "/imports/plugins/core/accounts/server/no-meteor/shopsUserHasPermissionFor";
import getRootUrl from "/imports/plugins/core/core/server/util/getRootUrl";
import getAbsoluteUrl from "/imports/plugins/core/core/server/util/getAbsoluteUrl";

/**
 * @name buildContext
 * @method
 * @memberof GraphQL
 * @summary Mutates the provided context object, adding `user`, `userId`, `shopId`, and
 *   `userHasPermission` properties.
 * @param {Object} context - A context object on which to set additional context properties
 * @param {Object} request - Request object
 * @param {Object} request.headers - Map of headers from the client request
 * @param {String} request.hostname - Hostname derived from Host or X-Forwarded-Host header
 * @param {String} request.protocol - Either http or https
 * @param {Object} [request.user] - The user who authenticated this request, if applicable
 * @returns {undefined} No return
 */
export default async function buildContext(context, request = {}) {
  // To support mocking the user in integration tests, we respect `context.user` if already set
  if (!context.user) {
    context.user = request.user || null;
  }

  const userId = (context.user && context.user._id) || null;
  context.userId = userId;

  if (userId) {
    const account = await context.collections.Accounts.findOne({ userId });
    context.account = account;
    context.accountId = (account && account._id) || null;
  }

  // DEPRECATED. Client requests should include a shopId if one is needed.
  context.shopId = await context.queries.primaryShopId(context.collections);

  // Add a curried hasPermission tied to the current user (or to no user)
  context.userHasPermission = getHasPermissionFunctionForUser(context.user);

  // Add array of all shopsIds user has permissions for
  context.shopsUserHasPermissionFor = getShopsUserHasPermissionForFunctionForUser(context.user);

  context.rootUrl = getRootUrl(request);
  context.getAbsoluteUrl = (path) => getAbsoluteUrl(context.rootUrl, path);

  // Make some request headers available to resolvers on context, but remove any
  // with potentially sensitive information in them.
  context.requestHeaders = { ...request.headers };
  delete context.requestHeaders.authorization;
  delete context.requestHeaders.cookie;
  delete context.requestHeaders["meteor-login-token"];
}
