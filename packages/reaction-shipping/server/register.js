ReactionCore.registerPackage({
  label: "Shipping",
  name: "reaction-shipping",
  icon: "fa fa-truck",
  autoEnable: true,
  settings: {
    name: "Flat Rate Service"
  },
  registry: [
    {
      provides: "dashboard",
      route: "/dashboard/shipping",
      name: "shipping",
      label: "Shipping",
      description: "Provide shipping rates",
      icon: "fa fa-truck",
      priority: 2,
      container: "core",
      workflow: "coreDashboardWorkflow",
      template: "shipping"
    },
    {
      label: "Shipping Settings",
      route: "/dashboard/shipping/settings",
      name: "shipping/settings",
      provides: "settings",
      template: "shippingSettings"
    },
    {
      template: "flatRateCheckoutShipping",
      provides: "shippingMethod"
    }
  ]
});
