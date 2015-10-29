Template.coreOrderCreated.onCreated(() => {
  let template = Template.instance();
  let currentData = Template.currentData();

  template.orderDep = new Tracker.Dependency;

  function getOrder(orderId, shipmentId) {
    template.orderDep.depend();
    return ReactionCore.Collections.Orders.findOne({
      "_id": orderId,
      "shipping._id": shipmentId
    });
  }

  Tracker.autorun(() => {
    template.order = getOrder(currentData.orderId, currentData.fulfillment._id);
  });
});

/*
 * automatically start order processing on first view
 */

Template.coreOrderCreated.onRendered(function () {
  let template = Template.instance();
  let order = template.order;

  if (order.workflow) {
    if (order.workflow.status === "coreOrderCreated") {
      order.workflow.status = "coreOrderCreated";
      Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "coreOrderCreated", order._id);
    }
  }
});

/**
 * coreOrderCreated events
 *
 */
Template.coreOrderCreated.events({
  'click .btn': function () {
    Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "coreOrderCreated", this._id);
  }
});


Template.coreOrderCreated.helpers({
  order() {
    let template = Template.instance();
    return template.order;
  },
  shipment() {
    return Template.instance().order.shipping[0];
  },
  tracking() {
    let shipment = Template.instance().order.shipping[0];
    if (shipment.tracking) {
      return shipment.tracking;
    }

    return i18n.t("orderShipping.noTracking");
  },
  shipmentStatus() {
    let shipment = Template.instance().order.shipping[0];
    if (shipment.shipped) {
      return {
        shipped: true,
        status: "success",
        label: i18n.t("orderShipping.shipped")
      }
    }

    return {
      shipped: false,
      status: "info",
      label: i18n.t("orderShipping.notShipped")
    }
  }
});
