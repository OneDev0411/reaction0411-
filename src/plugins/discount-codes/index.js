import i18n from "./i18n/index.js";
import getCreditOffDiscount from "./util/getCreditOffDiscount.js";
import getItemPriceDiscount from "./util/getItemPriceDiscount.js";
import getPercentageOffDiscount from "./util/getPercentageOffDiscount.js";
import getShippingDiscount from "./util/getShippingDiscount.js";
import mutations from "./mutations/index.js";
import queries from "./queries/index.js";
import resolvers from "./resolvers/index.js";
import schemas from "./schemas/index.js";
import startup from "./startup.js";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionAPI} app The ReactionAPI instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Codes",
    name: "discount-codes",
    collections: {
      DiscountCodes: {
        name: "DiscountCodes",
        indexes: [
          [{ code: 1 }, { name: "c2_code" }]
        ]
      }
    },
    i18n,
    functionsByType: {
      "discounts/codes/credit": [getCreditOffDiscount],
      "discounts/codes/discount": [getPercentageOffDiscount],
      "discounts/codes/sale": [getItemPriceDiscount],
      "discounts/codes/shipping": [getShippingDiscount],
      "startup": [startup]
    },
    graphQL: {
      resolvers,
      schemas
    },
    mutations,
    queries,
    registry: [
      {
        label: "Codes",
        provides: ["paymentSettings"],
        template: "customDiscountCodes"
      }, {
        provides: ["paymentMethod"],
        template: "discountCodesCheckout"
      }, {
        route: "discounts/apply",
        label: "Apply Discounts",
        permission: "applyDiscounts",
        name: "discounts/apply"
      }
    ]
  });
}
