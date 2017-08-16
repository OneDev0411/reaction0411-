/* global Gravatar */
import { Meteor } from "meteor/meteor";
import _ from "lodash";
import { Reaction } from "/client/api";
import * as Collections from "/lib/collections";

/**
 * sortUsersIntoGroups - helper - client
 * @summary puts each full user object into an array on the group they belong
 * @param {Array} accounts - list of user account objects
 * @param {Array} groups - list of permission groups
 * @return {Array} - array of groups, each having a `users` field
 */
export default function sortUsersIntoGroups({ accounts, groups }) {
  const newGroups = groups.map((group) => {
    const matchingAccounts = accounts.map((acc) => {
      if (acc.groups && acc.groups.indexOf(group._id) > -1) {
        return acc;
      }
    });
    group.users = _.compact(matchingAccounts);
    return group;
  });
  return newGroups;
}

// sort to display higher permission groups and "owner" at the top
export function sortGroups(groups) {
  return groups.sort((prev, next) => {
    if (next.slug === "owner") { return 1; } // owner tops
    return next.permissions.length - prev.permissions.length;
  });
}

/**
 * getInvitableGroups - helper - client
 * @summary puts each full user object into an array on the group they belong
 * This generates a list of groups the user can invite to.
 * It filters out the owner group (because you cannot invite directly to an existing shop as owner)
 * It also filters out groups that the user does not have needed permissions to invite to.
 * All these are also checked by the Meteor method, so this is done to prevent trying to invite and getting error
 * @param {Array} groups - list of user account objects
 * @param {Func} canInviteToGroup - func determining user group rights
 * @return {Array} - array of groups or empty object
 */
export function getInvitableGroups(groups, canInviteToGroup) {
  return groups
    .filter(grp => grp.slug !== "owner")
    .filter(grp => canInviteToGroup({ group: grp, user: Meteor.user() })) || [{}];
}

// user's default invite groups is the group they belong
// exception is the owner group (because you cannot invite directly to an existing shop as owner). For that case,
// it defaults to shop manager
export function getDefaultUserInviteGroup(groups) {
  let result;
  const user = Collections.Accounts.findOne({ userId: Meteor.userId() });
  result = groups.find(grp => user && user.groups.indexOf(grp._id) > -1);

  if (result && result.slug === "owner") {
    result = groups.find(grp => grp.slug === "shop manager");
  }

  return result;
}

export function getGravatar(user) {
  const options = {
    secure: true,
    size: 30,
    default: "identicon"
  };
  if (!user) { return false; }
  const account = Collections.Accounts.findOne(user._id);
  if (account && account.profile && account.profile.picture) {
    return account.profile.picture;
  }
  if (user.emails && user.emails.length > 0) {
    const email = user.emails[0].address;
    return Gravatar.imageUrl(email, options);
  }
}

export function groupPermissions(packages) {
  return packages.map((pkg) => {
    const permissions = [];
    if (pkg.registry && pkg.enabled) {
      for (const registryItem of pkg.registry) {
        if (!registryItem.route) {
          continue;
        }

        // Get all permissions, add them to an array
        if (registryItem.permissions) {
          for (const permission of registryItem.permissions) {
            // check needed because of non-object perms in the permissions array (e.g "admin", "owner")
            if (typeof permission === "object") {
              permission.shopId = Reaction.getShopId();
              permissions.push(permission);
            }
          }
        }

        // Also create an object map of those same permissions as above
        const permissionMap = getPermissionMap(permissions);
        if (!permissionMap[registryItem.route]) {
          permissions.push({
            shopId: pkg.shopId,
            permission: registryItem.name || pkg.name + "/" + registryItem.template,
            icon: registryItem.icon,
            label: registryItem.label || registryItem.provides || registryItem.route
          });
        }
      }
      // TODO review this, hardcoded WIP "reaction"
      const label = pkg.name.replace("reaction", "").replace(/(-.)/g, (x) => " " + x[1].toUpperCase());

      return {
        shopId: pkg.shopId,
        icon: pkg.icon,
        name: pkg.name,
        label: label,
        permissions: _.uniq(permissions)
      };
    }
  });
}

function getPermissionMap(permissions) {
  const permissionMap = {};
  permissions.forEach((existing) => (permissionMap[existing.permission] = existing.label));
  return permissionMap;
}
