import getFulfillmentMethodsWithQuotes from "./getFulfillmentMethodsWithQuotes";
import resolvers from "./resolvers";
import mutations from "./mutations";
import queries from "./queries";
import schemas from "./schemas";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @return {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Shipping Rates",
    name: "reaction-shipping-rates",
    icon: "fa fa-truck-o",
    collections: {
      FlatRateFulfillmentRestrictions: {
        name: "FlatRateFulfillmentRestrictions",
        indexes: [
          [{ methodIds: 1 }]
        ]
      },
      Shipping: {
        name: "Shipping",
        indexes: [
          // Create indexes. We set specific names for backwards compatibility
          // with indexes created by the aldeed:schema-index Meteor package.
          [{ name: 1 }, { name: "c2_name" }],
          [{ shopId: 1 }, { name: "c2_shopId" }]
        ]
      }
    },
    graphQL: {
      resolvers,
      schemas
    },
    mutations,
    queries,
    functionsByType: {
      getFulfillmentMethodsWithQuotes: [getFulfillmentMethodsWithQuotes]
    },
    settings: {
      name: "Flat Rate Service",
      flatRates: {
        enabled: false
      }
    },
    registry: [
      {
        provides: ["dashboard"],
        route: "/shipping/rates",
        name: "shipping",
        label: "Shipping",
        description: "Provide shipping rates",
        icon: "fa fa-truck",
        priority: 1,
        container: "core",
        workflow: "coreDashboardWorkflow"
      },
      {
        provides: ["shippingSettings"],
        name: "shipping/settings/flatRates",
        label: "Flat Rate",
        description: "Provide shipping rates",
        icon: "fa fa-truck",
        template: "ShippingRatesSettings"
      },
      {
        template: "flatRateCheckoutShipping",
        name: "shipping/flatRates",
        provides: ["shippingMethod"]
      }
    ]
  });
}
