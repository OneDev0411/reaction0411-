
/**
 * when order is first viewed we'll push the order status to created
 */
Template.coreOrderWorkflow.onRendered(function () {
  const order = Template.currentData();
  // force order created to always be completed.
  if (order.workflow.status === "coreOrderCreated") {
    Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "coreOrderCreated", order._id);
  }

  if (order.shipping) {
    if (order.shipping[0].workflow.status === "new") {
      Meteor.call("workflow/pushOrderShipmentWorkflow", "coreOrderShipmentWorkflow", "coreOrderShippingCreated", order._id. order.shipping[0]._id);
    }
  }
});


/**
 * coreOrderWorkflowHelpers
 */
Template.coreOrderWorkflow.helpers({
  /**
   * orderFulfillmentData
   * @summary Creates an Object with order id and a fulfillment object
   * @param  {String} orderId - An order id
   * @param  {Object} fulfillment - An order fulfillment. e.g. a shipment
   * @return {Object} An object witht the order id and fulfillment
   */
  orderFulfillmentData(orderId, fulfillment) {
    return {
      orderId: orderId,
      fulfillment: fulfillment
    };
  },

  /**
   * baseOrder
   * @todo may be unnecessary
   * @return {Object} contents of Template.currentData(), non-reactive
   */
  baseOrder() {
    return Template.currentData();
  },

  /**
   * order
   * @return {Object|Boolean} An order or false
   */
  order() {
    let currentData = Template.currentData();

    if (currentData) {
      return ReactionCore.Collections.Orders.findOne(currentData._id);
    }

    return false;
  },

  /**
   * fulfillmentNumber
   * @param  {Number} index - A number
   * @return {Number} index + 1
   */
  fulfillmentNumber(index) {
    return index + 1;
  },

  /**
   * isCompleted
   * @todo may need to be refactored
   * @return {String|Boolean} order completion status or false
   */
  isCompleted() {
    let order = Template.parentData(1);
    if (this.status === true) {
      return order.workflow.status;
    }
    return false;
  },

  /**
   * isPending
   * @todo may need to be refactored
   * @return {String|Boolean} status or false
   */
  isPending() {
    if (this.status === this.template) {
      return this.status;
    }
    return false;
  }
});
