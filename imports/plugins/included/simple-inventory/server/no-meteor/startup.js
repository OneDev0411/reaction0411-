import Logger from "@reactioncommerce/logger";

/**
 * @summary Get all order items
 * @param {Object} order The order
 * @return {Object[]} Order items from all fulfillment groups in a single array
 */
function getAllOrderItems(order) {
  return order.shipping.reduce((list, group) => [...list, ...group.items], []);
}

/**
 * @summary Called on startup
 * @param {Object} context Startup context
 * @param {Object} context.collections Map of MongoDB collections
 * @returns {undefined}
 */
export default function startup(context) {
  const { app, appEvents, collections } = context;

  const SimpleInventory = app.db.collection("SimpleInventory");
  collections.SimpleInventory = SimpleInventory;

  appEvents.on("afterOrderCancel", async ({ order, returnToStock }) => {
    // Inventory is removed from stock only once an order has been approved
    // This is indicated by payment.status being anything other than `created`
    // We need to check to make sure the inventory has been removed before we return it to stock
    const orderIsApproved = !Array.isArray(order.payments) || order.payments.length === 0 ||
      !!order.payments.find((payment) => payment.status !== "created");

    const bulkWriteOperations = [];

    // If order is approved, the inventory has been taken away from `inventoryInStock`
    if (returnToStock && orderIsApproved) {
      getAllOrderItems(order).forEach((item) => {
        bulkWriteOperations.push({
          updateOne: {
            filter: {
              productConfiguration: {
                productId: item.productId,
                variantId: item.variantId
              }
            },
            update: {
              $inc: {
                inventoryInStock: item.quantity
              }
            }
          }
        });
      });
    } else if (!orderIsApproved) {
      // If order is not approved, the inventory hasn't been taken away from `inventoryInStock` yet but is in `inventoryReserved`
      getAllOrderItems(order).forEach((item) => {
        bulkWriteOperations.push({
          updateOne: {
            filter: {
              productConfiguration: {
                productId: item.productId,
                variantId: item.variantId
              }
            },
            update: {
              $inc: {
                inventoryReserved: -item.quantity
              }
            }
          }
        });
      });
    }

    SimpleInventory.bulkWrite(bulkWriteOperations, { ordered: false }).catch((error) => {
      Logger.error(error, "Bulk write error in simple-inventory afterOrderCancel listener");
    });
  });

  appEvents.on("afterOrderCreate", async ({ order }) => {
    const bulkWriteOperations = getAllOrderItems(order).map((item) => ({
      updateOne: {
        filter: {
          productConfiguration: {
            productId: item.productId,
            variantId: item.variantId
          }
        },
        update: {
          $inc: {
            inventoryReserved: item.quantity
          }
        }
      }
    }));

    SimpleInventory.bulkWrite(bulkWriteOperations, { ordered: false }).catch((error) => {
      Logger.error(error, "Bulk write error in simple-inventory afterOrderCreate listener");
    });
  });

  appEvents.on("afterOrderApprovePayment", async ({ order }) => {
    // We only decrease the inventory quantity after the final payment is approved
    const nonApprovedPayment = (order.payments || []).find((payment) => payment.status === "created");
    if (nonApprovedPayment) return;

    const bulkWriteOperations = getAllOrderItems(order).map((item) => ({
      updateOne: {
        filter: {
          productConfiguration: {
            productId: item.productId,
            variantId: item.variantId
          }
        },
        update: {
          $inc: {
            inventoryInStock: -item.quantity,
            inventoryReserved: -item.quantity
          }
        }
      }
    }));

    SimpleInventory.bulkWrite(bulkWriteOperations, { ordered: false }).catch((error) => {
      Logger.error(error, "Bulk write error in simple-inventory afterOrderApprovePayment listener");
    });
  });
}
