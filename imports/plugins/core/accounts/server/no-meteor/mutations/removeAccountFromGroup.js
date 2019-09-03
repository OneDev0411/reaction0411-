import SimpleSchema from "simpl-schema";
import ReactionError from "@reactioncommerce/reaction-error";
import ensureRoles from "/imports/plugins/core/accounts/server/no-meteor/util/ensureRoles";

const inputSchema = new SimpleSchema({
  accountId: String,
  groupId: String
});
/**
 * @name accounts/removeAccountFromGroup
 * @memberof Mutations/Accounts
 * @summary Removes a user from a group for a shop, and adds them to the default customer group.
 * Updates the user's permission list to reflect.
 * (NB: At this time, a user only belongs to only one group per shop)
 * @param {Object} context - GraphQL execution context
 * @param {Object} input - Necessary input for mutation. See SimpleSchema.
 * @param {String} input.accountId - optional decoded ID of account on which entry should be updated, for admin
 * @param {String} input.groupId - decoded ID of the group to remove account from
 * @returns {Promise<Object>} with modified group
 */
export default async function removeAccountFromGroup(context, input) {
  inputSchema.validate(input);
  const { appEvents, collections, userHasPermission, userId: userIdFromContext } = context;
  const { Accounts, Groups, users } = collections;
  const {
    accountId: providedAccountId,
    groupId
  } = input;

  const account = await Accounts.findOne({ _id: providedAccountId });
  const accountUser = await users.findOne({ _id: account.userId });
  const { shopId } = await Groups.findOne({ _id: groupId }) || {};
  const defaultCustomerGroupForShop = await Groups.findOne({ slug: "customer", shopId }) || {};

  // we are limiting group method actions to only users with admin roles
  // this also include shop owners, since they have the `admin` role in their Roles.GLOBAL_GROUP
  if (!userHasPermission(["admin"], shopId)) {
    throw new ReactionError("access-denied", "Access denied");
  }

  if (!account) throw new ReactionError("not-found", "No account found");
  if (!accountUser) throw new ReactionError("not-found", "No user found");

  await ensureRoles(context, defaultCustomerGroupForShop.permissions);
  await users.updateOne({
    _id: account.userId
  }, {
    $set: {
      [`roles.${shopId}`]: defaultCustomerGroupForShop.permissions
    }
  });

  const { value: updatedAccount } = await Accounts.findOneAndUpdate({
    _id: providedAccountId,
    groups: groupId
  }, {
    $set: { "groups.$": defaultCustomerGroupForShop._id }
  });

  if (!updatedAccount) {
    throw new ReactionError("server-error", "Unable to remove account from group");
  }

  await appEvents.emit("afterAccountUpdate", {
    account: updatedAccount,
    updatedBy: userIdFromContext,
    updatedFields: ["groups"]
  });

  return defaultCustomerGroupForShop;
}
