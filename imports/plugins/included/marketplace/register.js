import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "Marketplace",
  name: "reaction-marketplace",
  icon: "fa fa-globe",
  autoEnable: true,
  settings: {
    name: "Marketplace",
    public: {
      allowGuestSellers: true
    }
  },
  registry: [
    // Dashboard card
    /* Moved into catalog - settings below will provide a card instead
    {
      provides: "dashboard",
      label: "Marketplace",
      description: "Allow users to become sellers, switch shops UI",
      icon: "fa fa-globe",
      priority: 2,
      container: "marketplace",
      permissions: [{
        label: "Marketplace",
        permission: "dashboard/marketplace"
      }]
    },*/

    // Settings reside in Catalog settings
    {
      label: "Marketplace",
      icon: "fa fa-globe",
      provides: "catalogSettings",
      container: "dashboard",
      template: "marketplaceCatalogSettings"
    },
    {
      route: "/shop/settings",
      template: "shopSettings",
      name: "shopSettings",
      label: "Settings",
      icon: "fa fa-th",
      provides: "shortcut",
      permissions: [{
        label: "Admin",
        permission: "admin"
      },
      {
        label: "Seller",
        permission: "seller"
      }]
    }
  ]
});

