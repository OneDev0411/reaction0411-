import Reaction from "/imports/plugins/core/core/server/Reaction";

Reaction.registerPackage({
  label: "Rates",
  name: "discount-rates",
  icon: "fa fa-gift",
  settings: {
    "discount-rates": {
      enabled: false
    }
  },
  registry: [
    {
      label: "Rates",
      provides: ["catalogSettings"],
      template: "customDiscountRates"
    }
  ]
});
