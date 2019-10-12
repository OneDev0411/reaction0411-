import mutations from "./mutations/index.js";
import queries from "./queries/index.js";
import resolvers from "./resolvers/index.js";
import schemas from "./schemas/index.js";
import createDataLoaders from "./utils/createDataLoaders.js";
import { Shop } from "./simpleSchemas.js";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Shop",
    name: "reaction-shop",
    collections: {
      Packages: {
        name: "Packages",
        indexes: [
          // Create indexes. We set specific names for backwards compatibility
          // with indexes created by the aldeed:schema-index Meteor package.
          [{ name: 1, shopId: 1 }],
          [{ "registry.provides": 1 }, { name: "c2_registry.$.provides" }]
        ]
      },
      Shops: {
        name: "Shops",
        indexes: [
          // Create indexes. We set specific names for backwards compatibility
          // with indexes created by the aldeed:schema-index Meteor package.
          [{ domains: 1 }, { name: "c2_domains" }],
          [{ name: 1 }, { name: "c2_name" }],
          [{ slug: 1 }, { name: "c2_slug", sparse: true, unique: true }]
        ]
      }
    },
    graphQL: {
      resolvers,
      schemas
    },
    queries,
    mutations,
    functionsByType: {
      createDataLoaders: [createDataLoaders]
    },
    simpleSchemas: {
      Shop
    }
  });
}
