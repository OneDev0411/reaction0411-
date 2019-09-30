import { decodeShopOpaqueId } from "@reactioncommerce/reaction-graphql-xforms/shop";
import { getPaginatedResponse, wasFieldRequested } from "@reactioncommerce/reaction-graphql-utils";

/**
 * @name Query/surcharges
 * @method
 * @memberof Fulfillment/GraphQL
 * @summary resolver for the surcharges GraphQL mutation
 * @param {Object} parentResult - unused
 * @param {Object} args - an object of all arguments that were sent by the client
 * @param {String} args.shopId - The shop that owns these surcharges
 * @param {Object} context - an object containing the per-request state
 * @param {Object} info Info about the GraphQL request
 * @returns {Promise<Object>|undefined} A Surcharge object
 */
export default async function surcharges(parentResult, args, context, info) {
  const { shopId, ...connectionArgs } = args;

  const cursor = await context.queries.surcharges(context, {
    shopId: decodeShopOpaqueId(shopId)
  });

  return getPaginatedResponse(cursor, connectionArgs, {
    includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
    includeHasPreviousPage: wasFieldRequested("pageInfo.hasPreviousPage", info),
    includeTotalCount: wasFieldRequested("totalCount", info)
  });
}
