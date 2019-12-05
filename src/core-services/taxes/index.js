import i18n from "./i18n/index.js";
import mutateNewOrderItemBeforeCreate from "./mutateNewOrderItemBeforeCreate.js";
import mutateNewVariantBeforeCreate from "./mutateNewVariantBeforeCreate.js";
import publishProductToCatalog from "./publishProductToCatalog.js";
import { registerPluginHandler } from "./registration.js";
import mutations from "./mutations/index.js";
import preStartup from "./preStartup.js";
import queries from "./queries/index.js";
import resolvers from "./resolvers/index.js";
import schemas from "./schemas/index.js";
import setTaxesOnCart from "./util/setTaxesOnCart.js";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionAPI} app The ReactionAPI instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Taxes",
    name: "reaction-taxes",
    version: app.context.appVersion,
    i18n,
    cart: {
      transforms: [
        {
          name: "setTaxesOnCart",
          fn: setTaxesOnCart,
          priority: 30
        }
      ]
    },
    catalog: {
      publishedProductVariantFields: ["isTaxable", "taxCode", "taxDescription"]
    },
    functionsByType: {
      mutateNewOrderItemBeforeCreate: [mutateNewOrderItemBeforeCreate],
      mutateNewVariantBeforeCreate: [mutateNewVariantBeforeCreate],
      preStartup: [preStartup],
      publishProductToCatalog: [publishProductToCatalog],
      registerPluginHandler: [registerPluginHandler]
    },
    graphQL: {
      schemas,
      resolvers
    },
    mutations,
    queries,
    shopSettingsConfig: {
      defaultTaxCode: {
        rolesThatCanEdit: ["admin", "tax-settings/write"],
        simpleSchema: {
          type: String,
          min: 1
        }
      },
      fallbackTaxServiceName: {
        rolesThatCanEdit: ["admin", "tax-settings/write"],
        simpleSchema: {
          type: String,
          min: 1
        }
      },
      primaryTaxServiceName: {
        rolesThatCanEdit: ["admin", "tax-settings/write"],
        simpleSchema: {
          type: String,
          min: 1
        }
      }
    }
  });
}
