import _ from "lodash";
import path from "path";
import moment from "moment";
import accounting from "accounting-js";
import Future from "fibers/future";
import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { getSlug } from "/lib/api";
import { Cart, Media, Orders, Products, Shops } from "/lib/collections";
import * as Schemas from "/lib/collections/schemas";
import { Logger, Reaction } from "/server/api";


// helper to return the order credit object
// the first credit paymentMethod on the order
// returns entire payment method
export function orderCreditMethod(order) {
  return order.billing.filter(value => value.paymentMethod.method ===  "credit")[0];
}
// helper to return the order debit object
export function orderDebitMethod(order) {
  return order.billing.filter(value => value.paymentMethod.method ===  "debit")[0];
}

/**
 * Reaction Order Methods
 */
export const methods = {
  /**
   * orders/shipmentTracking
   * @summary wraps addTracking and triggers workflow update
   * @param {Object} order - order Object
   * @param {String} tracking - tracking number to add to order
   * @returns {String} returns workflow update result
   */
  "orders/shipmentTracking": function (order, tracking) {
    check(order, Object);
    check(tracking, String);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    this.unblock();
    const orderId = order._id;

    Meteor.call("orders/addTracking", orderId, tracking);
    Meteor.call("orders/updateHistory", orderId, "Tracking Added", tracking);
    Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "coreShipmentTracking", order._id);

    // Set the status of the items as shipped
    const itemIds = template.order.shipping[0].items.map((item) => {
      return item._id;
    });

    Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/tracking", order._id, itemIds);
  },

  // shipmentPrepare
  "orders/documentPrepare": (order) => {
    check(order, Object);
    this.unblock();

    if (order) {
      return Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "coreOrderDocuments", order._id);
    }
  },

  /**
   * orders/shipmentPacked
   *
   * @summary update packing status
   * @param {Object} order - order object
   * @param {Object} shipment - shipment object
   * @param {Boolean} packed - packed status
   * @return {Object} return workflow result
   */
  "orders/shipmentPacked": function (order, shipment, packed) {
    check(order, Object);
    check(shipment, Object);
    check(packed, Boolean);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    if (order) {
      Orders.update({
        "_id": order._id,
        "shipping._id": shipment._id
      }, {
        $set: {
          "shipping.$.packed": packed
        }
      });

      // Set the status of the items as packed
      const itemIds = shipment.items.map((item) => {
        return item._id;
      });

      const result = Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/packed", order, itemIds);
      if (result === 1) {
        return Orders.update({
          "_id": order._id,
          "shipping._id": shipment._id
        }, {
          $set: {
            "shipping.$.packed": packed
          }
        });
      }
      return result;
    }
  },

  /**
   * orders/makeAdjustmentsToInvoice
   *
   * @summary Update the status of an invoice to allow adjustments to be made
   * @param {Object} order - order object
   * @return {Object} Mongo update
   */
  "orders/makeAdjustmentsToInvoice": function (order) {
    check(order, Object);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    return Orders.update({
      "_id": order._id,
      "billing.paymentMethod.method": "credit"
    }, {
      $set: {
        "billing.$.paymentMethod.status": "adjustments"
      }
    });
  },

  /**
   * orders/approvePayment
   *
   * @summary Approve payment and apply any adjustments
   * @param {Object} order - order object
   * @return {Object} return this.processPayment result
   */
  "orders/approvePayment": function (order) {
    check(order, Object);
    const invoice = orderCreditMethod(order).invoice;

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }
    this.unblock();

    // this is server side check to verify
    // that the math all still adds up.
    const subTotal = invoice.subtotal;
    const shipping = invoice.shipping;
    const taxes = invoice.taxes;
    const discount = invoice.discounts;
    const discountTotal = Math.max(0, subTotal - discount); // ensure no discounting below 0.
    const total = accounting.toFixed(discountTotal + shipping + taxes, 2);

    return Orders.update({
      "_id": order._id,
      "billing.paymentMethod.method": "credit"
    }, {
      $set: {
        "billing.$.paymentMethod.amount": total,
        "billing.$.paymentMethod.status": "approved",
        "billing.$.paymentMethod.mode": "capture",
        "billing.$.invoice.discounts": discount,
        "billing.$.invoice.total": total
      }
    });
  },

  /**
   * orders/processPayment
   *
   * @summary trigger processPayment and workflow update
   * @param {Object} order - order object
   * @return {Object} return this.processPayment result
   */
  "orders/processPayment": function (order) {
    check(order, Object);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    return Meteor.call("orders/processPayments", order._id, function (error, result) {
      if (result) {
        Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "coreProcessPayment", order._id);

        // Set the status of the items as shipped
        const itemIds = order.shipping[0].items.map((item) => {
          return item._id;
        });

        Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/captured", order, itemIds);

        return this.processPayment(order);
      }
      return false;
    });
  },
  /**
   * orders/shipmentShipped
   *
   * @summary trigger shipmentShipped status and workflow update
   * @param {Object} order - order object
   * @param {Object} shipment - shipment object
   * @return {Object} return results of several operations
   */
  "orders/shipmentShipped": function (order, shipment) {
    check(order, Object);
    check(shipment, Object);

    if (!Reaction.hasPermission("orders")) {
      Logger.error("User does not have 'orders' permissions");
      throw new Meteor.Error("access-denied", "Access Denied");
    }

    this.unblock();

    let completedItemsResult;
    let completedOrderResult;

    const itemIds = shipment.items.map((item) => {
      return item._id;
    });

    // TODO: In the future, this could be handled by shipping delivery status
    const workflowResult = Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/shipped", order, itemIds);

    if (workflowResult === 1) {
      // Move to completed status for items
      completedItemsResult = Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/completed", order, itemIds);

      if (completedItemsResult === 1) {
        // Then try to mark order as completed.
        completedOrderResult = Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "completed", order);
      }
    }

    if (order.email) {
      Meteor.call("orders/sendNotification", order, "shipped");
    } else {
      Logger.warn("No order email found. No notification sent.");
    }

    Orders.update({
      "_id": order._id,
      "shipping._id": shipment._id
    }, {
      $set: {
        "shipping.$.shipped": true
      }
    });

    return {
      workflowResult: workflowResult,
      completedItems: completedItemsResult,
      completedOrder: completedOrderResult
    };
  },

  /**
   * orders/shipmentDelivered
   *
   * @summary trigger shipmentShipped status and workflow update
   * @param {Object} order - order object
   * @return {Object} return workflow result
   */
  "orders/shipmentDelivered": function (order) {
    check(order, Object);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    const shipment = order.shipping[0];

    if (order.email) {
      Meteor.call("orders/sendNotification", order, (err) => {
        if (err) {
          Logger.error(err, "orders/shipmentShipped: Failed to send notification");
        }
      });
    } else {
      Logger.warn("No order email found. No notification sent.");
    }

    const itemIds = shipment.items.map((item) => {
      return item._id;
    });

    Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/delivered", order, itemIds);
    Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/completed", order, itemIds);

    const isCompleted = _.every(order.items, (item) => {
      return _.includes(item.workflow.workflow, "coreOrderItemWorkflow/completed");
    });

    Orders.update({
      "_id": order._id,
      "shipping._id": shipment._id
    }, {
      $set: {
        "shipping.$.delivered": true
      }
    });

    if (isCompleted === true) {
      Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "completed", order);
      return true;
    }

    Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "processing", order);

    return false;
  },

  /**
   * orders/sendNotification
   *
   * @summary send order notification email
   * @param {Object} order - order object
   * @param {Object} action - send notification action
   * @return {Boolean} email sent or not
   */
  "orders/sendNotification": function (order, action) {
    check(order, Object);
    check(action, Match.OneOf(String, undefined));

    if (!this.userId) {
      Logger.error("orders/sendNotification: Access denied");
      throw new Meteor.Error("access-denied", "Access Denied");
    }

    this.unblock();

    // Get Shop information
    const shop = Shops.findOne(order.shopId);

    // Get shop logo, if available
    let emailLogo;
    if (Array.isArray(shop.brandAssets)) {
      const brandAsset = _.find(shop.brandAssets, (asset) => asset.type === "navbarBrandImage");
      const mediaId = Media.findOne(brandAsset.mediaId);
      emailLogo = path.join(Meteor.absoluteUrl(), mediaId.url());
    } else {
      emailLogo = Meteor.absoluteUrl() + "resources/email-templates/shop-logo.png";
    }

    // Combine same products into single "product" for display purposes
    const combinedItems = [];
    if (order) {
      // Loop through all items in the order. The items are split into indivital items
      for (const orderItem of order.items) {
        // Find an exising item in the combinedItems array
        const foundItem = combinedItems.find((combinedItem) => {
          // If and item variant exists, then we return true
          if (combinedItem.variants) {
            return combinedItem.variants._id === orderItem.variants._id;
          }

          return false;
        });

        // Increment the quantity count for the duplicate product variants
        if (foundItem) {
          foundItem.quantity++;
        } else {
          // Otherwise push the unique item into the combinedItems array
          combinedItems.push(orderItem);

          // Placeholder image if there is no product image
          orderItem.placeholderImage = Meteor.absoluteUrl() + "resources/placeholder.gif";

          const variantImage = Media.findOne({
            "metadata.productId": orderItem.productId,
            "metadata.variantId": orderItem.variants._id
          });
          // variant image
          if (variantImage) {
            orderItem.variantImage = path.join(Meteor.absoluteUrl(), variantImage.url());
          }
          // find a default image
          const productImage = Media.findOne({ "metadata.productId": orderItem.productId });
          if (productImage) {
            orderItem.productImage = path.join(Meteor.absoluteUrl(), productImage.url());
          }
        }
      }

      const billing = orderCreditMethod(order);
      const refundResult = Meteor.call("orders/refunds/list", order);
      let refundTotal = 0;

      _.each(refundResult, function (item) {
        refundTotal += parseFloat(item.amount);
      });

      // Merge data into single object to pass to email template
      const dataForEmail = {
        // Shop Data
        shop: shop,
        contactEmail: shop.emails[0].address,
        homepage: Meteor.absoluteUrl(),
        emailLogo: emailLogo,
        copyrightDate: moment().format("YYYY"),
        legalName: shop.addressBook[0].company,
        physicalAddress: {
          address: shop.addressBook[0].address1 + " " + shop.addressBook[0].address2,
          city: shop.addressBook[0].city,
          region: shop.addressBook[0].region,
          postal: shop.addressBook[0].postal
        },
        shopName: shop.name,
        socialLinks: {
          display: true,
          facebook: {
            display: true,
            icon: Meteor.absoluteUrl() + "resources/email-templates/facebook-icon.png",
            link: "https://www.facebook.com"
          },
          googlePlus: {
            display: true,
            icon: Meteor.absoluteUrl() + "resources/email-templates/google-plus-icon.png",
            link: "https://plus.google.com"
          },
          twitter: {
            display: true,
            icon: Meteor.absoluteUrl() + "resources/email-templates/twitter-icon.png",
            link: "https://www.twitter.com"
          }
        },
        // Order Data
        order: order,
        billing: {
          address: {
            address: billing.address.address1,
            city: billing.address.city,
            region: billing.address.region,
            postal: billing.address.postal
          },
          paymentMethod: billing.paymentMethod.storedCard || billing.paymentMethod.processor,
          subtotal: accounting.toFixed(billing.invoice.subtotal, 2),
          shipping: accounting.toFixed(billing.invoice.shipping, 2),
          taxes: accounting.toFixed(billing.invoice.taxes, 2),
          discounts: accounting.toFixed(billing.invoice.discounts, 2),
          refunds: accounting.toFixed(refundTotal, 2),
          total: accounting.toFixed(billing.invoice.total, 2),
          adjustedTotal: accounting.toFixed(billing.paymentMethod.amount - refundTotal, 2)
        },
        combinedItems: combinedItems,
        orderDate: moment(order.createdAt).format("MM/DD/YYYY"),
        orderUrl: getSlug(shop.name) + "/cart/completed?_id=" + order.cartId,
        shipping: {
          tracking: order.shipping[0].tracking,
          carrier: order.shipping[0].shipmentMethod.carrier,
          address: {
            address: order.shipping[0].address.address1,
            city: order.shipping[0].address.city,
            region: order.shipping[0].address.region,
            postal: order.shipping[0].address.postal
          }
        }
      };

      Logger.debug(`orders/sendNotification status: ${order.workflow.status}`);


      // handle missing root shop email
      if (!shop.emails[0].address) {
        shop.emails[0].address = "no-reply@reactioncommerce.com";
        Logger.warn("No shop email configured. Using no-reply to send mail");
      }

      // anonymous users without emails.
      if (!order.email) {
        const msg = "No order email found. No notification sent.";
        Logger.warn(msg);
        throw new Meteor.Error("email-error", msg);
      }

      // Compile Email with SSR
      let subject;
      let tpl;

      if (action === "shipped") {
        tpl = "orders/shipped";
        subject = "orders/shipped/subject";
      } else if (action === "refunded") {
        tpl = "orders/refunded";
        subject = "orders/refunded/subject";
      } else {
        tpl = `orders/${order.workflow.status}`;
        subject = `orders/${order.workflow.status}/subject`;
      }

      SSR.compileTemplate(tpl, Reaction.Email.getTemplate(tpl));
      SSR.compileTemplate(subject, Reaction.Email.getSubject(tpl));

      Reaction.Email.send({
        to: order.email,
        from: `${shop.name} <${shop.emails[0].address}>`,
        subject: SSR.render(subject, dataForEmail),
        html: SSR.render(tpl, dataForEmail)
      });

      return true;
    }
    return false;
  },

  /**
   * orders/orderCompleted
   *
   * @summary trigger orderCompleted status and workflow update
   * @param {Object} order - order object
   * @return {Object} return this.orderCompleted result
   */
  "orders/orderCompleted": function (order) {
    check(order, Object);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "coreOrderCompleted", order._id);

    return this.orderCompleted(order);
  },

  /**
   * orders/addShipment
   * @summary Adds tracking information to order without workflow update.
   * Call after any tracking code is generated
   * @param {String} orderId - add tracking to orderId
   * @param {String} data - tracking id
   * @return {String} returns order update result
   */
  "orders/addShipment": function (orderId, data) {
    check(orderId, String);
    check(data, Object);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    // temp hack until we build out multiple payment handlers
    const cart = Cart.findOne(cartId);
    let shippingId = "";
    if (cart.shipping) {
      shippingId = cart.shipping[0]._id;
    }

    return Orders.update({
      "_id": orderId,
      "shipping._id": shippingId
    }, {
      $addToSet: {
        "shipping.shipments": data
      }
    });
  },

  /**
   * orders/updateShipmentTracking
   * @summary Adds tracking information to order without workflow update.
   * Call after any tracking code is generated
   * @param {Object} order - An Order object
   * @param {Object} shipment - A Shipment object
   * @param {String} tracking - tracking id
   * @return {String} returns order update result
   */
  "orders/updateShipmentTracking": function (order, shipment, tracking) {
    check(order, Object);
    check(shipment, Object);
    check(tracking, String);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    return Orders.update({
      "_id": order._id,
      "shipping._id": shipment._id
    }, {
      $set: {
        ["shipping.$.tracking"]: tracking
      }
    });
  },

  /**
   * orders/addItemToShipment
   * @summary Adds tracking information to order without workflow update.
   * Call after any tracking code is generated
   * @param {String} orderId - add tracking to orderId
   * @param {String} shipmentId - shipmentId
   * @param {ShipmentItem} item - A ShipmentItem to add to a shipment
   * @return {String} returns order update result
   */
  "orders/addItemToShipment": function (orderId, shipmentId, item) {
    check(orderId, String);
    check(shipmentId, String);
    check(item, Object);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    return Orders.update({
      "_id": orderId,
      "shipping._id": shipmentId
    }, {
      $push: {
        "shipping.$.items": item
      }
    });
  },

  "orders/updateShipmentItem": function (orderId, shipmentId, item) {
    check(orderId, String);
    check(shipmentId, Number);
    check(item, Object);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    return Orders.update({
      "_id": orderId,
      "shipments._id": shipmentId
    }, {
      $addToSet: {
        "shipment.$.items": shipmentIndex
      }
    });
  },

  /**
   * orders/addShipment
   * @summary Adds tracking information to order without workflow update.
   * Call after any tracking code is generated
   * @param {String} orderId - add tracking to orderId
   * @param {String} shipmentIndex - shipmentIndex
   * @return {String} returns order update result
   */
  "orders/removeShipment": function (orderId, shipmentIndex) {
    check(orderId, String);
    check(shipmentIndex, Number);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    Orders.update(orderId, {
      $unset: {
        [`shipments.${shipmentIndex}`]: 1
      }
    });
    return Orders.update(orderId, {
      $pull: {
        shipments: null
      }
    });
  },

  /**
   * orders/addOrderEmail
   * @summary Adds email to order, used for guest users
   * @param {String} cartId - add tracking to orderId
   * @param {String} email - valid email address
   * @return {String} returns order update result
   */
  "orders/addOrderEmail": function (cartId, email) {
    check(cartId, String);
    check(email, String);
    /**
    *Instead of checking the Orders permission, we should check if user is
    *connected.This is only needed for guest where email is
    *provided for tracking order progress.
    */

    if (!Meteor.userId()) {
      throw new Meteor.Error(403, "Access Denied. You are not connected.");
    }

    return Orders.update({
      cartId: cartId
    }, {
      $set: {
        email: email
      }
    });
  },
  /**
   * orders/updateDocuments
   * @summary Adds file, documents to order. use for packing slips, labels, customs docs, etc
   * @param {String} orderId - add tracking to orderId
   * @param {String} docId - CFS collection docId
   * @param {String} docType - CFS docType
   * @return {String} returns order update result
   */
  "orders/updateDocuments": function (orderId, docId, docType) {
    check(orderId, String);
    check(docId, String);
    check(docType, String);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    return Orders.update(orderId, {
      $addToSet: {
        documents: {
          docId: docId,
          docType: docType
        }
      }
    });
  },

  /**
   * orders/updateHistory
   * @summary adds order history item for tracking and logging order updates
   * @param {String} orderId - add tracking to orderId
   * @param {String} event - workflow event
   * @param {String} value - event value
   * @return {String} returns order update result
   */
  "orders/updateHistory": function (orderId, event, value) {
    check(orderId, String);
    check(event, String);
    check(value, Match.Optional(String));

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    return Orders.update(orderId, {
      $addToSet: {
        history: {
          event: event,
          value: value,
          userId: Meteor.userId(),
          updatedAt: new Date()
        }
      }
    });
  },

  /**
   * orders/inventoryAdjust
   * adjust inventory when an order is placed
   * @param {String} orderId - add tracking to orderId
   * @return {null} no return value
   */
  "orders/inventoryAdjust": function (orderId) {
    check(orderId, String);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const order = Orders.findOne(orderId);
    order.items.forEach(item => {
      Products.update({
        _id: item.variants._id
      }, {
        $inc: {
          inventoryQuantity: -item.quantity
        }
      }, {
        selector: {
          type: "variant"
        }
      });
    });
  },

  /**
   * orders/capturePayments
   * @summary Finalize any payment where mode is "authorize"
   * and status is "approved", reprocess as "capture"
   * @todo: add tests working with new payment methods
   * @todo: refactor to use non Meteor.namespace
   * @param {String} orderId - add tracking to orderId
   * @return {null} no return value
   */
  "orders/capturePayments": (orderId) => {
    check(orderId, String);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    const order = Orders.findOne(orderId);
    const itemIds = order.shipping[0].items.map((item) => {
      return item._id;
    });

    Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/captured", order, itemIds);

    // process order..payment.paymentMethod
    _.each(order.billing, function (billing) {
      const paymentMethod = billing.paymentMethod;
      const transactionId = paymentMethod.transactionId;

      if (paymentMethod.mode === "capture" && paymentMethod.status === "approved" && paymentMethod.processor) {
        // Grab the amount from the shipment, otherwise use the original amount
        const processor = paymentMethod.processor.toLowerCase();

        Meteor.call(`${processor}/payment/capture`, paymentMethod, (error, result) => {
          if (result && result.saved === true) {
            const metadata = Object.assign(billing.paymentMethod.metadata || {}, result.metadata || {});

            Orders.update({
              "_id": orderId,
              "billing.paymentMethod.transactionId": transactionId
            }, {
              $set: {
                "billing.$.paymentMethod.mode": "capture",
                "billing.$.paymentMethod.status": "completed",
                "billing.$.paymentMethod.metadata": metadata
              },
              $push: {
                "billing.$.paymentMethod.transactions": result
              }
            });

            // Temporarily(?) put here the Shippo's method/label purchasing.After a succesfull capture fund
            if (order.shipping[0].shipmentMethod.settings) {
              Meteor.call("shippo/confirmShippingMethodForOrder", orderId);
            }
          } else {
            if (result && result.error) {
              Logger.fatal("Failed to capture transaction.", order, paymentMethod.transactionId, result.error);
            } else {
              Logger.fatal("Failed to capture transaction.", order, paymentMethod.transactionId, error);
            }

            Orders.update({
              "_id": orderId,
              "billing.paymentMethod.transactionId": transactionId
            }, {
              $set: {
                "billing.$.paymentMethod.mode": "capture",
                "billing.$.paymentMethod.status": "error"
              },
              $push: {
                "billing.$.paymentMethod.transactions": result
              }
            });

            return { error: "orders/capturePayments: Failed to capture transaction" };
          }
          return { error, result };
        });
      }
    });
  },

  /**
   * orders/refund/list
   * loop through order's payments and find existing refunds.
   * @summary Get a list of refunds for a particular payment method.
   * @param {Object} order - order object
   * @return {null} no return value
   */
  "orders/refunds/list": function (order) {
    check(order, Object);
    const paymentMethod = orderCreditMethod(order).paymentMethod;

    if (!this.userId === order.userId && !Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    const future = new Future();
    const processor = paymentMethod.processor.toLowerCase();

    Meteor.call(`${processor}/refund/list`, paymentMethod, (error, result) => {
      if (error) {
        future.return(error);
      } else {
        check(result, [Schemas.Refund]);
        future.return(result);
      }
    });

    return future.wait();
  },

  /**
   * orders/refund/create
   *
   * @summary Apply a refund to an already captured order
   * @param {String} orderId - order object
   * @param {Object} paymentMethod - paymentMethod object
   * @param {Number} amount - Amount of the refund, as a positive number
   * @return {null} no return value
   */
  "orders/refunds/create": function (orderId, paymentMethod, amount) {
    check(orderId, String);
    check(paymentMethod, Reaction.Schemas.PaymentMethod);
    check(amount, Number);

    if (!Reaction.hasPermission("orders")) {
      throw new Meteor.Error(403, "Access Denied");
    }
    const processor = paymentMethod.processor.toLowerCase();
    const order = Orders.findOne(orderId);
    const transactionId = paymentMethod.transactionId;

    const result = Meteor.call(`${processor}/refund/create`, paymentMethod, amount);
    Orders.update({
      "_id": orderId,
      "billing.paymentMethod.transactionId": transactionId
    }, {
      $push: {
        "billing.$.paymentMethod.transactions": result
      }
    });

    if (result.saved === false) {
      Logger.fatal("Attempt for refund transaction failed", order._id, paymentMethod.transactionId, result.error);
      throw new Meteor.Error("Attempt to refund transaction failed", result.error);
    }

    // Send email to notify cuustomer of a refund
    Meteor.call("orders/sendNotification", order, "refunded");
  }
};

Meteor.methods(methods);
