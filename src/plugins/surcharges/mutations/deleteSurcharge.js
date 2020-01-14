import SimpleSchema from "simpl-schema";
import ReactionError from "@reactioncommerce/reaction-error";

const inputSchema = new SimpleSchema({
  surchargeId: String,
  shopId: String
});

/**
 * @method deleteSurcharge
 * @summary deletes a surcharge
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input - Input (see SimpleSchema)
 * @returns {Promise<Object>} An object with a `surcharge` property containing the deleted surcharge
 */
export default async function deleteSurcharge(context, input) {
  inputSchema.validate(input);

  const { surchargeId, shopId } = input;
  const { collections } = context;
  const { Surcharges } = collections;

  await context.validatePermissions(`reaction:legacy:surcharges:${surchargeId}`, "delete", { shopId, legacyRoles: ["owner", "admin", "shipping"] });

  const { ok, value } = await Surcharges.findOneAndDelete({
    _id: surchargeId,
    shopId
  });
  if (ok !== 1) throw new ReactionError("not-found", "Not found");

  return { surcharge: value };
}
