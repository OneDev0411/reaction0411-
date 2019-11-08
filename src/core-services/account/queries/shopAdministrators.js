/**
 * @name shopAdministrators
 * @method
 * @memberof Accounts/NoMeteorQueries
 * @summary return Account object for all users who are "owner" or "admin" role for the shop
 * @param {Object} context - an object containing the per-request state
 * @param {String} id - ID of shop
 * @returns {Object[]} Array of user account objects
 */
export default async function shopAdministratorsQuery(context, id) {
  const { collections } = context;
  const { Accounts, users: Users } = collections;

  await context.validatePermissionsLegacy(["owner", "admin"], null, { shopId: id });
  await context.validatePermissions(`reaction:shops:${id}`, "read", { shopId: id });

  const users = await Users.find({
    [`roles.${id}`]: "admin"
  }, {
    projection: { _id: 1 }
  }).toArray();
  const userIds = users.map(({ _id }) => _id);

  return Accounts.find({ _id: { $in: userIds } });
}
