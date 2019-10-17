/**
 * @name navigationItemsByShopId
 * @method
 * @memberof Navigation/NoMeteorQueries
 * @summary Query for loading navigation items by shop id
 * @param {Object} context An object containing the per-request state
 * @param {String} shopId The _id of the shop to load navigation items for
 * @returns {Promise<MongoCursor>} - A MongoDB cursor for the proper query
 */
export default async function navigationItemsByShopId(context, shopId) {
  const { checkPermissions, collections } = context;
  const { NavigationItems } = collections;

  await checkPermissions(["core"], shopId);

  return NavigationItems.find({ shopId });
}
