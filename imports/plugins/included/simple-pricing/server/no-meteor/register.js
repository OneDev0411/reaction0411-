import queries from "./queries";
import resolvers from "./resolvers";
import schemas from "./schemas";
import startup from "./startup";
import getMinPriceSortByFieldPath from "./util/getMinPriceSortByFieldPath";
import publishProductToCatalog from "./util/publishProductToCatalog";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @return {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Pricing",
    name: "reaction-pricing",
    icon: "fa fa-dollar-sign",
    functionsByType: {
      getMinPriceSortByFieldPath: [getMinPriceSortByFieldPath],
      publishProductToCatalog: [publishProductToCatalog],
      startup: [startup]
    },
    graphQL: {
      resolvers,
      schemas
    },
    queries
  });
}
