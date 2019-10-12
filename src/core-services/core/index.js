import i18n from "./i18n/index.js";
import startup from "./startup.js";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Core",
    name: "core",
    i18n,
    functionsByType: {
      startup: [startup]
    },
    settings: {
      public: {
        allowGuestCheckout: true
      },
      mail: {
        user: "",
        password: "",
        host: "",
        port: ""
      },
      openexchangerates: {
        appId: "",
        refreshPeriod: "every 1 hour"
      }
    },
    layout: [{
      layout: "coreLayout",
      workflow: "coreWorkflow",
      theme: "default",
      enabled: true,
      structure: {
        template: "products",
        layoutHeader: "NavBar",
        layoutFooter: "Footer",
        notFound: "productNotFound",
        dashboardControls: "dashboardControls",
        adminControlsFooter: "adminControlsFooter"
      }
    }, {
      layout: "coreLayout",
      workflow: "coreWorkflow",
      theme: "default",
      enabled: true,
      structure: {
        template: "unauthorized",
        layoutHeader: "NavBar",
        layoutFooter: "Footer"
      }
    }]
  });
}
