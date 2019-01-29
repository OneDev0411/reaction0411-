import stripeNpm from "stripe";
import packageJson from "/package.json";
import Logger from "@reactioncommerce/logger";
import getStripeApiKey from "./getStripeApiKey";

/**
 * @name stripeListRefunds
 * @method
 * @summary List refunds
 * @param {Object} context an object containing the per-request state
 * @param {Object} paymentMethod object containing transaction ID
 * @return {Object} list refunds result
 * @private
 */
export default async function stripeListRefunds(context, paymentMethod) {
  const stripeKey = await getStripeApiKey(context, paymentMethod.paymentPluginName, paymentMethod.shopId);
  const stripe = stripeNpm(stripeKey);
  stripe.setAppInfo({
    name: "ReactionCommerce",
    version: packageJson.version,
    url: packageJson.url
  });

  let refundListResults;
  try {
    refundListResults = await stripe.refunds.list({ charge: paymentMethod.transactionId });
  } catch (error) {
    Logger.error("Encountered an error when trying to list refunds", error.message);
  }

  const result = [];
  if (refundListResults && refundListResults.data) {
    for (const refund of refundListResults.data) {
      result.push({
        type: refund.object,
        amount: refund.amount / 100,
        created: refund.created * 1000,
        currency: refund.currency,
        raw: refund
      });
    }
  }
  return result;
}
