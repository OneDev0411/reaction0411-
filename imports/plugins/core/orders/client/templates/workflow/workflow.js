import { Template } from "meteor/templating";
import { Reaction } from "/client/api";
import { Orders } from "/lib/collections";
import OrderCard from "/imports/plugins/core/orders/client/containers/orderCardContainer";

Template.coreOrderWorkflow.helpers({
  /**
   * @summary Reaction Order component
   * @return {Component} React OrderCard component
   * @ignore
   */
  orderCard() {
    return OrderCard;
  },

  /**
   * @summary Creates an Object with order id and a fulfillment object
   * @param  {String} orderId - An order id
   * @param  {Object} fulfillment - An order fulfillment. e.g. a shipment
   * @return {Object} An object with the order id and fulfillment
   * @ignore
   */
  orderFulfillmentData(orderId, fulfillment) {
    return {
      orderId,
      fulfillment
    };
  },

  /**
   * @return {Object|Boolean} An order or false
   * @ignore
   */
  order() {
    const id = this.order ? this.order._id : Reaction.Router.getQueryParam("_id");
    if (id) {
      return Orders.findOne({
        $or: [
          { _id: id },
          { referenceId: id }
        ]
      });
    }
    return false;
  },

  /**
   * @param  {Number} index - A number
   * @return {Number} index + 1
   * @ignore
   */
  fulfillmentNumber(index) {
    return index + 1;
  },

  /**
   * @todo may need to be refactored
   * @return {String|Boolean} order completion status or false
   * @ignore
   */
  isCompleted() {
    const order = Template.parentData(1);
    if (this.status === true) {
      return order.workflow.status;
    }
    return false;
  },

  /**
   * @todo may need to be refactored
   * @return {String|Boolean} status or false
   * @ignore
   */
  isPending() {
    if (this.status === this.template) {
      return this.status;
    }
    return false;
  }
});
