import { Meteor } from "meteor/meteor";
import i18n from "./i18n";
import resolvers from "./resolvers";
import schemas from "./schemas";

// This is temporary. Mutations still import jobs, which don't
// work outside of a Meteor environment.
let mutations = {};
if (!Meteor.isFakeMeteor) {
  mutations = require("./mutations").default;
}

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Sitemap Generator",
    name: "reaction-sitemap-generator",
    icon: "fa fa-vine",
    i18n,
    collections: {
      Sitemaps: {
        name: "Sitemaps",
        indexes: [
          [{ shopId: 1, handle: 1 }]
        ]
      }
    },
    graphQL: {
      resolvers,
      schemas
    },
    mutations
  });
}
