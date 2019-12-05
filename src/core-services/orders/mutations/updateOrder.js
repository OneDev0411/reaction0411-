import SimpleSchema from "simpl-schema";
import ReactionError from "@reactioncommerce/reaction-error";
import { Order as OrderSchema } from "../simpleSchemas.js";

const inputSchema = new SimpleSchema({
  customFields: {
    type: Object,
    blackbox: true,
    optional: true
  },
  email: {
    type: String,
    optional: true
  },
  orderId: String,
  status: {
    type: String,
    optional: true
  }
});

/**
 * @method updateOrder
 * @summary Use this mutation to update order status, email, and other
 *   properties
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input - Necessary input. See SimpleSchema
 * @returns {Promise<Object>} Object with `order` property containing the updated order
 */
export default async function updateOrder(context, input) {
  inputSchema.validate(input);

  const {
    customFields,
    email,
    orderId,
    status
  } = input;

  const { appEvents, collections, isInternalCall, userId } = context;
  const { Orders } = collections;

  // First verify that this order actually exists
  const order = await Orders.findOne({ _id: orderId });
  if (!order) throw new ReactionError("not-found", "Order not found");

  // At this point, this mutation only updates the workflow status, which should not be allowed
  // for the order creator. In the future, if this mutation does more, we should revisit these
  // permissions to see if order owner should be allowed.
  if (!isInternalCall) {
    await context.validatePermissions(`reaction:orders:${order._id}`, "update", { shopId: order.shopId, legacyRoles: ["orders", "order/fulfillment"] });
  }

  const modifier = {
    $set: {
      updatedAt: new Date()
    }
  };

  if (email) modifier.$set.email = email;

  if (customFields) modifier.$set.customFields = customFields;

  if (status && order.workflow.status !== status) {
    modifier.$set["workflow.status"] = status;
    modifier.$push = {
      "workflow.workflow": status
    };
  }

  // Skip updating if we have no updates to make
  if (Object.keys(modifier.$set).length === 1) return { order };

  OrderSchema.validate(modifier, { modifier: true });

  const { modifiedCount, value: updatedOrder } = await Orders.findOneAndUpdate(
    { _id: orderId },
    modifier,
    { returnOriginal: false }
  );
  if (modifiedCount === 0 || !updatedOrder) throw new ReactionError("server-error", "Unable to update order");

  await appEvents.emit("afterOrderUpdate", {
    order: updatedOrder,
    updatedBy: userId
  });

  return { order: updatedOrder };
}
