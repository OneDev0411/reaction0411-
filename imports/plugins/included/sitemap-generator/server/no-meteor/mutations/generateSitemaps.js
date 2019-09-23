import ReactionError from "@reactioncommerce/reaction-error";
import { Job, Jobs } from "/imports/plugins/included/job-queue/server/no-meteor/jobs";

/**
 * @name sitemap/generateSitemaps
 * @memberof Mutations/Sitemap
 * @method
 * @summary Regenerates sitemap files for primary shop
 * @param {Object} context - GraphQL execution context
 * @returns {Undefined} triggers sitemap generation job
 */
export default async function generateSitemaps(context) {
  const { userHasPermission, userId } = context;

  const shopId = await context.queries.primaryShopId(context.collections);

  if (userHasPermission(["admin"], shopId) === false) {
    throw new ReactionError("access-denied", "User does not have permissions to generate sitemaps");
  }

  new Job(Jobs, "sitemaps/generate", { notifyUserId: userId, shopId }).save({ cancelRepeats: true });
}
