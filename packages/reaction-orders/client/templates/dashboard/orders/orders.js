

const orderFilters = [{
  name: "new",
  label: "New"
}, {
  name: "processing",
  label: "Processing"
}, {
  name: "completed",
  label: "Completed"
}];

const OrderHelper =  {
  makeQuery(filter) {
    let query = {};

    switch (filter) {
      // New orders
    case "new":
      query = {
        "workflow.status": "new"
      };
      break;

      // Orders that have yet to be captured & shipped
    case "processing":
      query = {
        "workflow.status": "coreOrderWorkflow/processing"
      };
      break;

      // Orders that have been shipped, based on if the items have been shipped
    case "shipped":
      query = {
        "items.workflow.status": "coreOrderItemWorkflow/shipped"
      };
      break;

      // Orders that are complete, including all items with complete status
    case "completed":
      query = {
        "workflow.status": "coreOrderWorkflow/completed",
        "items.workflow.workflow": {
          $in: ["coreOrderItemWorkflow/completed"]
        }
      };
      break;

      // Orders that have been captured, but not yet shipped
    case "captured":
      query = {
        "billing.paymentMethod.status": "completed",
        "shipping.shipped": false
      };
      break;

    case "canceled":
      query = {
        "workflow.status": "canceled"
      };
      break;

      // Orders that have been refunded partially or fully
    case "refunded":
      query = {
        "billing.paymentMethod.status": "captured",
        "shipping.shipped": true
      };
      break;
    default:
    }

    return query;
  }
};

Template.orders.onCreated(function () {
  this.state = new ReactiveDict();
  this.state.setDefault({
    orders: []
  });

  // Watch for updates to the subscription and query params
  // fetch available orders
  this.autorun(() => {
    this.subscribe("Orders");
    const filter = ReactionRouter.getQueryParam("filter");
    const query = OrderHelper.makeQuery(filter);
    const orders = ReactionCore.Collections.Orders.find(query).fetch();

    this.state.set("orders", orders);
  });

  // Watch for updates to shop collection
  this.autorun(() => {
    const shop = ReactionCore.Collections.Shops.findOne({});

    // Update currency information, this is passed to child components containing
    // Numeric inputs
    this.state.set("currency", shop.currencies[shop.currency]);
  });

  // Open the action view when necessary
  this.autorun(() => {
    let isActionViewOpen = ReactionCore.isActionViewOpen();
    const queryParams = ReactionRouter.current().queryParams;

    if (isActionViewOpen === false) {
      ReactionRouter.go("orders", {}, queryParams);
    }
  });
});

/**
 * orders helpers
 */
Template.orders.helpers({
  itemProps(order) {
    return {
      order,
      currencyFormat: Template.instance().state.get("currency")
    };
  },

  orders() {
    return Template.instance().state.get("orders") || false;
  },

  currentFilterLabel() {
    let foundFilter = _.find(orderFilters, (filter) => {
      return filter.name === ReactionRouter.getQueryParam("filter");
    });

    if (foundFilter) {
      return foundFilter.label;
    }

    return "";
  },
  activeClassname(orderId) {
    if (ReactionRouter.getQueryParam("_id") === orderId) {
      return "panel-info";
    }
    return "panel-default";
  }
});

Template.ordersListItem.helpers({
  order() {
    return Template.currentData().order;
  },
  activeClassname(orderId) {
    if (ReactionRouter.getQueryParam("_id") === orderId) {
      return "active";
    }
  },

  orderIsNew(order) {
    return order.workflow.status === "new";
  }
});

Template.ordersListItem.events({
  "click [data-event-action=selectOrder]": function (event, instance) {
    event.preventDefault();
    const isActionViewOpen = ReactionCore.isActionViewOpen();

    // toggle detail views
    if (isActionViewOpen === false) {
      ReactionCore.showActionView({
        label: "Order Details",
        i18nKeyLabel: "orderWorkflow.orderDetails",
        data: instance.data.order,
        props: {
          size: "large"
        },
        template: "coreOrderWorkflow"
      });
    }
    ReactionRouter.setQueryParams({
      _id: instance.data.order._id
    });
  },
  "click [data-event-action=startProcessingOrder]": function (event, instance) {
    event.preventDefault();
    const isActionViewOpen = ReactionCore.isActionViewOpen();
    const { order } = instance.data;

    if (order.workflow.status === "new") {
      Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "processing", order);
    }
    // toggle detail views
    if (isActionViewOpen === false) {
      ReactionCore.showActionView({
        label: "Order Details",
        i18nKeyLabel: "orderWorkflow.orderDetails",
        data: order,
        props: {
          size: "large"
        },
        template: "coreOrderWorkflow"
      });
    }
    ReactionRouter.setQueryParams({
      filter: "processing",
      _id: order._id
    });
  }
});

Template.orderListFilters.onCreated(function () {
  this.state = new ReactiveDict();

  this.autorun(() => {
    const queryFilter = ReactionRouter.getQueryParam("filter");
    this.subscribe("Orders");

    const filters = orderFilters.map((filter) => {
      filter.label = i18next.t(`order.filter.${filter.name}`, {defaultValue: filter.label});
      filter.i18nKeyLabel = `order.filter.${filter.name}`;
      filter.count = ReactionCore.Collections.Orders.find(OrderHelper.makeQuery(filter.name)).count();

      if (queryFilter) {
        filter.active = queryFilter === filter.name;
      }

      return filter;
    });

    this.state.set("filters", filters);
  });
});

Template.orderListFilters.events({
  "click [role=tab]": (event) => {
    event.preventDefault();
    const filter = event.currentTarget.getAttribute("data-filter");
    const isActionViewOpen = ReactionCore.isActionViewOpen();
    if (isActionViewOpen === true) {
      ReactionCore.hideActionView();
    }
    ReactionRouter.setQueryParams({
      filter: filter,
      _id: null
    });
  }
});

Template.orderListFilters.helpers({
  filters() {
    return Template.instance().state.get("filters");
  },

  activeClassname(item) {
    if (item.active === true) {
      return "active";
    }
  }
});
