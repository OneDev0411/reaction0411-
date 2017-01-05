import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "Shippo",
  name: "reaction-shippo",
  icon: "fa fa-plane",
  autoEnable: true,
  settings: {
    shippo: {
      enabled: true
    },
    apiKey: ""
  },
  registry: [{
    provides: "dashboard",
    label: "Shippo",
    description: "Shippo service",
    icon: "fa fa-plane",
    priority: 1,
    container: "connect",
    permissions: [{
      label: "Shippo",
      permission: "dashboard/shippo"
    }]
  }, {
    label: "Shippo",
    route: "/dashboard/shippo",
    provides: "settings",
    container: "connection",
    template: "shippoSettings"
  }
  // WIP:
    // For now we use Flat Rate's checkout template( which inherits its methods from coreCheckoutShipping
    // to show all shipping methods in the same panel.
    // .If we are gonna proceed with different panel per provider, we need to enable the 'provides:"Shipping Method"',
    // alter coreCheckoutShipping checkout.js and inherit from there (or write specific logic) for a shippo's
    // checkout template.
    //
    // provides: "shippingMethod",
    // name: "shipping/methods/shippo",
    // template: "shippoCheckoutShipping"
    // Not needed at the time cause the coreCheckoutShipping is enough(inherited from Flatrate)
  //}
  ]
});
