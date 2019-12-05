import { createRequire } from "module";
import Logger from "@reactioncommerce/logger";

const require = createRequire(import.meta.url); // eslint-disable-line

const { curryN } = require("ramda");

const GLOBAL_GROUP = "__global_roles__";

/**
 * @name hasPermission
 * @method
 * @memberof Accounts
 * @param {Object} user - The user object, with `roles` property, to check.
 * @param {String[]} permissions - Array of permission strings. The account must have at least one of them either globally or for the roleGroup.
 * @param {String} [action] - The action being performed (unused).
 * @param {Object} authContext - context data to verify permissions against
 * @param {String} [authContext.shopId] - The shop ID for which the permissions are needed. If not set,
 *   only global roles will be checked.
 * @returns {Boolean} True if the account with ID accountId has at least one of the requested permissions in the roleGroup group
 */
export default function hasPermission(user, permissions, action, authContext = {}) {
  console.log(" ----- legacy hasPermission | user:", user);
  console.log(" ----- legacy hasPermission | permissions:", permissions);
  console.log(" ----- legacy hasPermission | action:", action);
  console.log(" ----- legacy hasPermission | authContext:", authContext);

  // TODO(pod-auth) - make context available here. IF the `authContext` has `owner` on it, we need to check that ID
  // vs the context userId to make sure they match / the current user is the owner
  // if it is the current user, we can return true here instead of checking the group.
  // otherwise, continue on
  // if (authContext && authContext.owner && authContext.owner === context.userId ) { return true } )


  const { shopId: roleGroup } = authContext;

  if (!user || !user.roles) return false;

  if (!Array.isArray(permissions)) throw new Error("permissions must be an array of strings");
  if (roleGroup !== undefined && roleGroup !== null && (typeof roleGroup !== "string" || roleGroup.length === 0)) {
    throw new Error("roleGroup must be a non-empty string");
  }

  const checkRoles = permissions.slice(0);

  // This should always return true for owners
  if (!checkRoles.includes("owner")) checkRoles.push("owner");

  const { roles } = user;

  // always check GLOBAL_GROUP
  const globalRoles = roles[GLOBAL_GROUP];
  if (Array.isArray(globalRoles) && checkRoles.some((role) => globalRoles.includes(role))) return true;

  if (roleGroup) {
    // convert any periods to underscores for MongoDB compatibility
    const group = roleGroup.replace(/\./g, "_");

    const groupRoles = roles[group];
    if (Array.isArray(groupRoles) && checkRoles.some((role) => groupRoles.includes(role))) return true;
  }

  Logger.debug(`User ${user._id} has none of [${checkRoles.join(", ")}] permissions`);

  return false;
}

const hasPermissionCurried = curryN(2, hasPermission);

/**
 * @summary Get a `hasPermission` function bound to the current user context
 * @param {Object} context App context
 * @return {Function} hasPermission function for `context.user`
 */
export function getHasPermissionFunctionForUserLegacy(context) {
  return hasPermissionCurried(context.user);
}
