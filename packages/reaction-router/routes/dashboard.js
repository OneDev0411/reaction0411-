const dashboardLayout = {
  template: "dashboardPackages", // main content area
  dashboard: "dashboard", // dashboard-drawer
  layoutHeader: "layoutHeader", // navigation
  layoutFooter: "layoutFooter", // footer
  loadingTemplate: "loading",
  notFoundTemplate: "notFound",
  unauthorized: "unauthorized",
  printLayout: "printLayout",
  adminControlsFooter: "adminControlsFooter",
  dashboardControls: "dashboardControls"
};

//
// define dashboard group
//

dashboard = FlowRouter.group({
  prefix: "/dashboard"
});

//
// dashboard home
//

dashboard.route("/dashboard", {
  name: "dashboard",
  action: function () {
    $(document).trigger("closeAllPopovers");
    BlazeLayout.render("coreAdminLayout", dashboardLayout);
  }
});

//
// dashboard orders
//
dashboard.route("/orders", {
  name: "dashboard/orders",
  subscriptions: function () {
    Meteor.subscribe("Orders");
  },
  action: function (params) {
    let orderLayout =  {
      template: "orders",
      dashboardHeaderControls: "orderListFilters",
      dashboardControls: ""
    };

    let layout =  Object.assign({}, dashboardLayout, orderLayout);
    BlazeLayout.render("coreAdminLayout", layout);

    if (ReactionCore.hasDashboardAccess() && params._id) {
      ReactionCore.showActionView({
        label: "Order Details",
        data: this.data(),
        props: {
          size: "large"
        },
        template: "coreOrderWorkflow"
      });
    }
  }
});

//
// dashboard package settings
//
dashboard.route("/:dashboard", {
  action: function (params) {
    let packageDetailLayout =  {
      template: params.dashboard
    };

    let layout =  Object.assign({}, dashboardLayout, packageDetailLayout);
    BlazeLayout.render("coreAdminLayout", layout);
  }
});

// this.route("dashboard", {
//   controller: ShopAdminController,
//   template: "dashboardPackages",
//   onBeforeAction: function () {
//     Session.set("dashboard", true);
//     return this.next();
//   }
// });
//
// this.route("dashboard/shop", {
//   controller: ShopAdminController,
//   path: "/dashboard/shop",
//   template: "shopDashboard",
//   data: function () {
//     return ReactionCore.Collections.Shops.findOne();
//   }
// });
//
// this.route("dashboard/import", {
//   controller: ShopAdminController,
//   path: "/dashboard/import",
//   template: "import"
// });
//
// this.route("dashboard/orders", {
//   controller: ShopAdminController,
//   path: "dashboard/orders/:_id?",
//   template: "orders",
//   onAfterAction: function () {
//     if (ReactionCore.hasDashboardAccess() && this.params._id) {
//       // this.layout("coreAdminLayout");
//       // Find a registry entry for this page that provides settings
//       // -- Settings is the default view for the "Action View"
//
//       ReactionCore.showActionView({
//         label: "Order Details",
//         data: this.data(),
//         props: {
//           size: "large"
//         },
//         template: "coreOrderWorkflow"
//       });
//
//       // this.render("dashboardPackages")
//       // $("body").addClass("admin");
//     } else {
//       // $("body").removeClass("admin");
//       // this.layout("coreLayout");
//     }
//
//     // return this.next();
//   },
//   waitOn: function () {
//     return this.subscribe("Orders");
//   },
//   data: function () {
//     if (Orders.findOne(this.params._id)) {
//       return ReactionCore.Collections.Orders.findOne({
//         _id: this.params._id
//       });
//     }
//   }
