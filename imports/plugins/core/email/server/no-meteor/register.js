import i18n from "./i18n";
import mutations from "./mutations";
import startup from "./startup";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Email",
    name: "reaction-email",
    icon: "fa fa-envelope-o",
    i18n,
    collections: {
      Emails: {
        name: "Emails",
        indexes: [
          // Create indexes. We set specific names for backwards compatibility
          // with indexes created by the aldeed:schema-index Meteor package.
          [{ jobId: 1 }, { name: "c2_jobId" }]
        ]
      }
    },
    mutations,
    functionsByType: {
      startup: [startup]
    },
    settings: {
      name: "Email"
    },
    registry: [{
      label: "Email Settings",
      description: "Email settings",
      icon: "fa fa-envelope-o",
      name: "email/settings",
      provides: ["settings"],
      workflow: "coreEmailWorkflow",
      template: "emailSettings",
      meta: {
        actionView: {
          dashboardSize: "md"
        }
      }
    }],
    layout: [{
      layout: "coreLayout",
      workflow: "coreEmailWorkflow",
      theme: "default",
      enabled: true,
      structure: {
        template: "email",
        layoutHeader: "NavBar",
        layoutFooter: "",
        notFound: "notFound",
        dashboardHeader: "dashboardHeader",
        dashboardControls: "dashboardControls",
        adminControlsFooter: "adminControlsFooter"
      }
    }]
  });
}
