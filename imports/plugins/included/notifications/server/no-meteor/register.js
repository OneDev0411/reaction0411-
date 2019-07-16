import startup from "./startup";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @return {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Notifications",
    name: "reaction-notification",
    icon: "fa fa-bell",
    collections: {
      Notifications: {
        name: "Notifications"
      }
    },
    functionsByType: {
      startup: [startup]
    },
    registry: [{
      label: "Notifications",
      name: "notifications",
      route: "/notifications",
      workflow: "coreWorkflow",
      permissions: [{
        label: "Notifications",
        permission: "notifications"
      }],
      template: "notificationRoute"
    }]
  });
}
