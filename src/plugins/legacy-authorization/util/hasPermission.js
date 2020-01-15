import { createRequire } from "module";
import Logger from "@reactioncommerce/logger";
import ReactionError from "@reactioncommerce/reaction-error";

const require = createRequire(import.meta.url); // eslint-disable-line

const { curryN } = require("ramda");

const GLOBAL_GROUP = "__global_permissions__";

/**
 * @name hasPermission
 * @param {Object} context App context
 * @param {Object} resource - resource user is trying to access
 * @param {Object} action - action user is trying to perform to be passed to in the GQL query
 * @param {Object} authContext - context data to verify permissions against
 * @param {String} [authContext.owner] - The owner of the resource requested
 * @param {String} [authContext.shopId] - The shop ID for which the permissions are needed. If not set,
 *   only global permissions will be checked.
 * @returns {Boolean} - true/false
 */
export default async function hasPermission(context, resource, action, authContext) {
  const { account } = context;

  if (!account || !account.permissions) return false;

  if (!resource) throw new ReactionError("invalid-param", "Resource must be provided");

  if (!action) throw new ReactionError("invalid-param", "Action must be provided");

  if (!authContext) throw new ReactionError("invalid-param", "authContext must be provided");

  // If the current user is the owner of a resource we are trying to check,
  // such as an order or data on a user profile, they are authorized to perform the action
  if (authContext && authContext.owner && authContext.owner === context.userId) return true;
  // Parse the provided data to create the permission name to check against (<organization>:<system>:<entity>/<action>)
  const { shopId } = authContext;
  const permissionName = `${resource.split(":").splice(0, 3).join(":")}/${action}`;

  // make sure shopId is a non-empty string (if provided)
  if (shopId !== undefined && shopId !== null && (typeof shopId !== "string" || shopId.length === 0)) {
    throw new ReactionError("invalid-param", "shopId must be a non-empty string");
  }

  // "owners" should always have access
  // we create an array with the provided permission, plus owner
  const checkPermissions = [permissionName, "owner", "reaction:legacy:shops/owner"]; // TODO(pod-auth): is this the best way to deal with an owner account? do we still have owners?

  // permissions that an account has, built by permissionsByUserId and attached to the context
  const { permissions } = account;

  // always check GLOBAL_GROUP
  const globalPermissions = permissions[GLOBAL_GROUP];
  if (Array.isArray(globalPermissions) && checkPermissions.some((permission) => globalPermissions.includes(permission))) return true;

  if (shopId) {
    const shopPermissions = permissions[shopId];
    if (Array.isArray(shopPermissions) && checkPermissions.some((permission) => shopPermissions.includes(permission))) return true;
  }

  Logger.debug(`User ${account.userId} has none of [${checkPermissions.join(", ")}] permissions`);

  return false;
}

const hasPermissionCurried = curryN(4, hasPermission);

/**
 * @summary Get a `hasPermission` function bound to the current user context
 * @param {Object} context App context
 * @return {Function} hasPermission function for `context`
 */
export function getHasPermissionFunctionForUser(context) {
  return hasPermissionCurried(context);
}
