/* eslint camelcase: 0 */
// meteor modules
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
// reaction modules
import { Reaction, Logger } from "/server/api";

import { StripeApi } from "./stripeapi";

const ValidCardNumber = Match.Where(function (x) {
  return /^[0-9]{14,16}$/.test(x);
});

const ValidExpireMonth = Match.Where(function (x) {
  return /^[0-9]{1,2}$/.test(x);
});

const ValidExpireYear = Match.Where(function (x) {
  return /^[0-9]{4}$/.test(x);
});

const ValidCVV = Match.Where(function (x) {
  return /^[0-9]{3,4}$/.test(x);
});

function parseCardData(data) {
  return {
    number: data.number,
    name: data.name,
    cvc: data.cvv2,
    exp_month: data.expire_month,
    exp_year: data.expire_year
  };
}

// Stripe uses a "Decimal-less" format so 10.00 becomes 1000
function formatForStripe(amount) {
  return Math.round(amount * 100);
}


Meteor.methods({
  "stripeSubmit": function (transactionType, cardData, paymentData) {
    check(transactionType, String);
    check(cardData, {
      name: String,
      number: ValidCardNumber,
      expire_month: ValidExpireMonth,
      expire_year: ValidExpireYear,
      cvv2: ValidCVV,
      type: String
    });
    check(paymentData, {
      total: String,
      currency: String
    });

    let chargeObj = {
      amount: "",
      currency: "",
      card: {},
      capture: true
    };

    if (transactionType === "authorize") {
      chargeObj.capture = false;
    }
    chargeObj.card = parseCardData(cardData);
    chargeObj.amount = formatForStripe(paymentData.total);
    chargeObj.currency = paymentData.currency;
    let result;
    let chargeResult;

    try {
      chargeResult = StripeApi.methods.createCharge.call({ chargeObj });
      if (chargeResult && chargeResult.status === "succeeded") {
        result = {
          saved: true,
          response: chargeResult
        };
      } else {
        Logger.info("Stripe Call succeeded but charge failed");
        result = {
          saved: false,
          error: chargeResult.error.message
        };
      }
      return result;
    } catch (e) {
      Logger.error(e);
      throw new Meteor.Error("error", e.message);
    }
  },

  /**
   * Capture a Stripe charge
   * @see https://stripe.com/docs/api#capture_charge
   * @param  {Object} paymentMethod A PaymentMethod object
   * @return {Object} results from Stripe normalized
   */
  "stripe/payment/capture": function (paymentMethod) {
    check(paymentMethod, Reaction.Schemas.PaymentMethod);
    let result;
    const captureDetails = {
      amount: formatForStripe(paymentMethod.amount)
    };

    try {
      const captureResult = StripeApi.methods.captureCharge.call({
        transactionId: paymentMethod.transactionId,
        captureDetails: captureDetails
      });
      if (captureResult.status === "succeeded") {
        result = {
          saved: true,
          response: captureResult
        };
      } else {
        result = {
          saved: false,
          response: captureResult
        };
      }
    } catch (error) {
      Logger.error(error);
      result = {
        saved: false,
        error: error
      };
      return { error, result };
    }
    return result;
  },

  /**
   * Issue a refund against a previously captured transaction
   * @see https://stripe.com/docs/api#refunds
   * @param  {Object} paymentMethod object
   * @param  {Number} amount to be refunded
   * @param  {String} reason refund was issued (currently unused by client)
   * @return {Object} result
   */
  "stripe/refund/create": function (paymentMethod, amount, reason = "requested_by_customer") {
    check(paymentMethod, Reaction.Schemas.PaymentMethod);
    check(amount, Number);
    check(reason, String);

    const refundDetails = {
      charge: paymentMethod.transactionId,
      amount: formatForStripe(amount),
      reason
    };

    let result;
    try {
      let refundResult = StripeApi.methods.createRefund.call({ refundDetails });
      if (refundResult.object === "refund") {
        result = {
          saved: true,
          response: refundResult
        };
      } else {
        result = {
          saved: false,
          response: refundResult
        };
        Logger.warn("Stripe call succeeded but refund not issued");
      }
    } catch (error) {
      Logger.error(error);
      result = {
        saved: false,
        error: error.message
      };
      return { error, result };
    }

    return result;
  },

  /**
   * List refunds
   * @param  {Object} paymentMethod object
   * @return {Object} result
   */
  "stripe/refund/list": function (paymentMethod) {
    check(paymentMethod, Reaction.Schemas.PaymentMethod);
    let result;
    try {
      const refunds = StripeApi.methods.listRefunds.call({transactionId: paymentMethod.transactionId});
      result = [];
      for (let refund of refunds.data) {
        result.push({
          type: refund.object,
          amount: refund.amount / 100,
          created: refund.created * 1000,
          currency: refund.currency,
          raw: refund
        });
      }
    } catch (error) {
      Logger.error(error);
      result = { error };
    }
    return result;
  }
});
