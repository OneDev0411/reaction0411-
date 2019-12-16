import i18n from "./i18n/index.js";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionAPI} app The ReactionAPI instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Core",
    name: "core",
    version: app.context.appVersion,
    i18n
  });
}
