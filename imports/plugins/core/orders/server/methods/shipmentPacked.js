import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Orders } from "/lib/collections";
import Reaction from "/imports/plugins/core/core/server/Reaction";

/**
 * @name orders/shipmentPacked
 * @method
 * @memberof Orders/Methods
 * @summary update packing status
 * @param {Object} order - order object
 * @param {Object} shipment - shipment object
 * @return {Object} return workflow result
 */
export default function shipmentPacked(order, shipment) {
  check(order, Object);
  check(shipment, Object);

  // REVIEW: who should have permission to do this in a marketplace setting?
  // Do we need to update the order schema to reflect multiple packers / shipments?
  if (!Reaction.hasPermission("orders")) {
    throw new Meteor.Error("access-denied", "Access Denied");
  }

  // Set the status of the items as packed
  const itemIds = shipment.items.map((item) => item._id);

  const result = Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/packed", order, itemIds);
  if (result === 1) {
    return Orders.update(
      {
        "_id": order._id,
        "shipping._id": shipment._id
      },
      {
        $set: {
          "shipping.$.workflow.status": "coreOrderWorkflow/packed"
        },
        $push: {
          "shipping.$.workflow.workflow": "coreOrderWorkflow/packed"
        }
      },
      { bypassCollection2: true }
    );
  }
  return result;
}
