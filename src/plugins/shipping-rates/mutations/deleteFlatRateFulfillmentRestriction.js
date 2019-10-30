import SimpleSchema from "simpl-schema";
import ReactionError from "@reactioncommerce/reaction-error";

const inputSchema = new SimpleSchema({
  restrictionId: String,
  shopId: String
});

/**
 * @method deleteFlatRateFulfillmentRestriction
 * @summary deletes a flat rate fulfillment restriction
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input - Input (see SimpleSchema)
 * @returns {Promise<Object>} An object with a `restriction` property containing the deleted restriction
 */
export default async function deleteFlatRateFulfillmentRestriction(context, input) {
  inputSchema.validate(input);

  const { restrictionId, shopId } = input;
  const { checkPermissions, collections } = context;
  const { FlatRateFulfillmentRestrictions } = collections;

  await checkPermissions(["admin", "owner", "shipping"], shopId);

  const { ok, value } = await FlatRateFulfillmentRestrictions.findOneAndDelete({
    _id: restrictionId,
    shopId
  });
  if (ok !== 1) throw new ReactionError("not-found", "Not found");

  return { restriction: value };
}
