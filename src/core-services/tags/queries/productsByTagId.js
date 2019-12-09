import arrayJoinPlusRemainingQuery from "@reactioncommerce/api-utils/arrayJoinPlusRemainingQuery.js";

/**
 * @name queries.productsByTagId
 * @method
 * @memberof Tags/Queries
 * @summary get a list of products by tag id
 * @param {Object} context - an object containing the per-request state
 * @param {Object} [params] - an object of all arguments that were sent by the client
 * @param {String} [params.shopId] - Shop ID
 * @param {String} [params.tagId] - Tag ID
 * @returns {Promise<Array<Object>>} array of TagProducts
 */
export default async function productsByTagId(context, params) {
  const { connectionArgs, shopId, tagId } = params;
  const { collections } = context;
  const { Products, Tags } = collections;

  // Check for owner or admin permissions from the user before allowing the query
  await context.validatePermissions(`reaction:tags:${tagId}`, "read", { shopId, legacyRoles: ["owner", "admin", "tag/admin", "tag/edit"] });

  return arrayJoinPlusRemainingQuery({
    arrayFieldPath: "featuredProductIds",
    collection: Tags,
    connectionArgs,
    joinCollection: Products,
    joinFieldPath: "_id",
    joinSelector: { hashtags: tagId, shopId },
    joinSortOrder: "asc",
    positionFieldName: "position",
    selector: { _id: tagId },
    sortByForRemainingDocs: "createdAt",
    sortOrderForRemainingDocs: "asc"
  });
}
