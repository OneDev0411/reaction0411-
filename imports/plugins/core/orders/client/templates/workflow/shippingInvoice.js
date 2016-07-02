require("money");
require("autonumeric");
import $ from "jquery";
import accounting from "accounting-js";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Reaction, i18next, Logger } from "/client/api";
import { NumericInput } from "/imports/plugins/core/ui/client/components";
import { Media, Orders, Shops } from "/lib/collections";

//
// core order shipping invoice templates
//
Template.coreOrderShippingInvoice.onCreated(function () {
  this.state = new ReactiveDict();

  // template.orderDep = new Tracker.Dependency;
  this.refunds = new ReactiveVar([]);
  this.refundAmount = new ReactiveVar(0.00);

  // function getOrder(orderId) {
  //   template.orderDep.depend();
  //   return Orders.findOne(orderId);
  // }

  this.autorun(() => {
    const currentData = Template.currentData();
    const order = Orders.findOne(currentData.orderId);
    const shop = Shops.findOne({});

    this.state.set("order", order);
    this.state.set("currency", shop.currencies[shop.currency]);

    // template.order = getOrder(currentData.orderId);
    if (order) {
      let paymentMethod = order.billing[0].paymentMethod;
      Meteor.call("orders/refunds/list", paymentMethod, (error, result) => {
        if (!error) {
          this.refunds.set(result);
        }
      });
    }
  });
});

Template.coreOrderShippingInvoice.onRendered(function () {
  const order = this.state.get("order");
  const paymentMethod = order.billing[0].paymentMethod;
  const refunds = this.refunds.get();
  const locale = Session.get("locale");
  const currency = locale.currency;

  const lessAmount = _.reduce(refunds, (memo, refund) => {
    return memo - Math.abs(refund.amount);
  }, paymentMethod.amount);

  if (currency) {
    $("input[name=refund_amount]").autoNumeric("init", {
      aSep: currency.thousand,
      dGroup: currency.grouping,
      aDec: currency.decimal,
      vMax: lessAmount
    });
  }
});

/**
 * coreOrderAdjustments events
 */
Template.coreOrderShippingInvoice.events({
  /**
   * Submit form
   * @param  {Event} event - Event object
   * @param  {Template} instance - Blaze Template
   * @return {void}
   */
  "submit form[name=capture]": (event, instance) => {
    event.preventDefault();

    const state = instance.state;
    const order = state.get("order");
    const discount = state.get("field-discount") || 0;

    Meteor.call("orders/approvePayment", order, discount, (error) => {
      if (error) {
        // Show error
        Logger.warn(error);
      }
    });
  },

  /**
   * Submit form
   * @param  {Event} event - Event object
   * @param  {Template} instance - Blaze Template
   * @return {void}
   */
  "submit form[name=refund]": (event, instance) => {
    event.preventDefault();

    const { state } = Template.instance();
    const order = instance.state.get("order");
    const refund = state.get("field-refund") || 0;
    const paymentMethod = order.billing[0].paymentMethod;

    Alerts.alert({
      title: i18next.t("order.applyRefundToThisOrder", { refund: refund }),
      showCancelButton: true,
      confirmButtonText: i18next.t("order.applyRefund")
    }, (isConfirm) => {
      if (isConfirm) {
        Meteor.call("orders/refunds/create", order._id, paymentMethod, refund, (error) => {
          if (error) {
            // Show error
          }

          state.set("field-refund", 0);
        });
      }
    });
  },

  "click [data-event-action=makeAdjustments]": (event, instance) => {
    event.preventDefault();

    Meteor.call("orders/makeAdjustmentsToInvoice", instance.state.get("order"));
  },

  "click [data-event-action=capturePayment]": (event, instance) => {
    event.preventDefault();

    const order = instance.state.get("order");

    Meteor.call("orders/capturePayments", order._id);
  },

  "change input[name=refund_amount], keyup input[name=refund_amount]": (event, instance) => {
    instance.refundAmount.set(accounting.unformat(event.target.value));
  }
});


/**
 * coreOrderShippingInvoice helpers
 */
Template.coreOrderShippingInvoice.helpers({
  NumericInput() {
    return NumericInput;
  },

  numericInputProps(fieldName, value = 0, enabled = true) {
    const { state } = Template.instance();
    const order = state.get("order");
    const status = order.billing[0].paymentMethod.status;
    const isApprovedAmount = (status === "approved" || status === "completed");

    return {
      component: NumericInput,
      numericType: "currency",
      value: value,
      disabled: !enabled,
      isEditing: !isApprovedAmount, // Dont allow editing if its approved
      format: state.get("currency"),
      classNames: {
        input: {amount: true},
        text: {
          "text-success": status === "completed"
        }
      },
      onChange(event, data) {
        state.set(`field-${fieldName}`, data.numberValue);
      }
    };
  },

  refundInputProps() {
    const { state } = Template.instance();
    const order = state.get("order");
    const paymentMethod = order.billing[0].paymentMethod;
    const refunds = Template.instance().refunds.get();

    let refundTotal = 0;
    _.each(refunds, function (item) {
      refundTotal += item.amount;
    });

    const adjustedTotal = paymentMethod.amount - refundTotal;

    return {
      component: NumericInput,
      numericType: "currency",
      value: 0,
      maxValue: adjustedTotal,
      format: state.get("currency"),
      classNames: {
        input: {amount: true}
      },
      onChange(event, data) {
        state.set("field-refund", data.numberValue);
      }
    };
  },

  refundAmount() {
    return Template.instance().refundAmount;
  },
  /**
   * Discount
   * @return {Number} current discount amount
   */
  invoice() {
    const instance = Template.instance();
    const order = instance.state.get("order");

    return order.billing[0].invoice;
  },

  money(amount) {
    return Reaction.Currency.formatNumber(amount);
  },

  currencySymbol() {
    // return Reaction.Locale.currency.symbol;
    const locale = Session.get("locale");
    return locale.currency.symbol;
  },

  disabled() {
    const instance = Template.instance();
    const order = instance.state.get("order");
    const status = order.billing[0].paymentMethod.status;

    if (status === "approved" || status === "completed") {
      return "disabled";
    }

    return "";
  },

  paymentPendingApproval() {
    const instance = Template.instance();
    const order = instance.state.get("order");
    const status = order.billing[0].paymentMethod.status;

    return status === "created" || status === "adjustments" || status === "error";
  },

  canMakeAdjustments() {
    const instance = Template.instance();
    const order = instance.state.get("order");
    const status = order.billing[0].paymentMethod.status;

    if (status === "approved" || status === "completed") {
      return false;
    }
    return true;
  },

  paymentApproved() {
    const instance = Template.instance();
    const order = instance.state.get("order");

    return order.billing[0].paymentMethod.status === "approved";
  },

  paymentCaptured() {
    const instance = Template.instance();
    const order = instance.state.get("order");

    return order.billing[0].paymentMethod.status === "completed";
  },

  refundTransactions() {
    const instance = Template.instance();
    const order = instance.state.get("order");
    const transactions = order.billing[0].paymentMethod.transactions;

    return _.filter(transactions, (transaction) => {
      return transaction.type === "refund";
    });
  },

  refunds() {
    let refunds = Template.instance().refunds.get();

    if (_.isArray(refunds)) {
      return refunds.reverse();
    }

    return false;
  },

  /**
   * Get the total after all refunds
   * @return {Number} the amount after all refunds
   */
  adjustedTotal() {
    const instance = Template.instance();
    const order = instance.state.get("order");
    const paymentMethod = order.billing[0].paymentMethod;
    const refunds = Template.instance().refunds.get();
    let refundTotal = 0;
    _.each(refunds, function (item) {
      refundTotal += item.amount;
    });
    return paymentMethod.amount - refundTotal;
  },

  refundSubmitDisabled() {
    const amount = Template.instance().state.get("field-refund") || 0;
    if (amount === 0) {
      return "disabled";
    }

    return null;
  },

  /**
   * Order
   * @summary find a single order using the order id spplied with the template
   * data context
   * @return {Object} A single order
   */
  order() {
    const instance = Template.instance();
    const order = instance.state.get("order");

    return order;
  },

  shipment() {
    const instance = Template.instance();
    const order = instance.state.get("order");

    let shipment = _.filter(order.shipping, {_id: currentData.fulfillment._id})[0];

    return shipment;
  },

  items() {
    const instance = Template.instance();
    const order = instance.state.get("order");
    const currentData = Template.currentData();
    const shipment = currentData.fulfillment;

    let items = _.map(shipment.items, (item) => {
      let originalItem = _.find(order.items, {
        _id: item._id
      });
      return _.extend(originalItem, item);
    });

    return items;
  },

  /**
   * Media - find meda based on a variant
   * @param  {String|Object} variantObjectOrId A variant of a product or a variant Id
   * @return {Object|false}    An object contianing the media or false
   */
  media(variantObjectOrId) {
    let variantId = variantObjectOrId;

    if (typeof variant === "object") {
      variantId = variantObjectOrId._id;
    }

    let defaultImage = Media.findOne({
      "metadata.variantId": variantId,
      "metadata.priority": 0
    });

    if (defaultImage) {
      return defaultImage;
    }

    return false;
  }
});
