import ReactionError from "@reactioncommerce/reaction-error";

/**
 * @name ordersByAccountId
 * @method
 * @memberof Order/NoMeteorQueries
 * @summary Query the Orders collection for orders made by the provided accountId and (optionally) shopIds
 * @param {Object} context - an object containing the per-request state
 * @param {Object} params - request parameters
 * @param {String} params.accountId - Account ID to search orders for
 * @param {String} params.shopIds - Shop IDs for the shops that owns the orders
 * @return {Promise<Object>|undefined} - An Array of Order documents, if found
 */
export default async function ordersByAccountId(context, { accountId, shopIds } = {}) {
  const { accountId: contextAccountId, collections, userHasPermission } = context;
  const { Orders } = collections;


  if (!accountId) {
    throw new ReactionError("invalid-param", "You must provide accountId arguments");
  }

  // Unless you are an admin with orders permission, you are limited to seeing it if you placed it
  if (accountId !== contextAccountId) {
    shopIds.forEach((shopId) => {
      if (!userHasPermission(["orders"], shopId)) {
        throw new ReactionError("access-denied", "Access Denied");
      }
    });
  }

  const query = {
    accountId
  };

  if (shopIds) query.shopId = { $in: shopIds };

  return Orders.find(query).toArray();
}
