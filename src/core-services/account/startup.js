import addPluginRolesToGroups from "./util/addPluginRolesToGroups.js";
import ensureRoles from "./util/ensureRoles.js";
import {
  defaultCustomerRoles,
  defaultOwnerRoles,
  defaultShopManagerRoles,
  defaultVisitorRoles
} from "./util/defaultRoles.js";

/**
 * @summary Called on startup
 * @param {Object} context Startup context
 * @param {Object} context.collections Map of MongoDB collections
 * @returns {undefined}
 */
export default async function startup(context) {
  // Add missing roles to `roles` collection if needed
  await ensureRoles(context, defaultCustomerRoles);
  await ensureRoles(context, defaultOwnerRoles);
  await ensureRoles(context, defaultShopManagerRoles);
  await ensureRoles(context, defaultVisitorRoles);

  // timing is important, packages are rqd for initial permissions configuration.
  if (process.env.NODE_ENV !== "jesttest") {
    await addPluginRolesToGroups(context);
  }
}
