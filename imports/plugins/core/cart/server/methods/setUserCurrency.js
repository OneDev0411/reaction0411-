import Hooks from "@reactioncommerce/hooks";
import Logger from "@reactioncommerce/logger";
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import * as Collections from "/lib/collections";
import getCart from "/imports/plugins/core/cart/server/util/getCart";

/**
 * @method cart/setUserCurrency
 * @memberof Cart/Methods
 * @summary Saves user currency in cart, to be paired with order/setCurrencyExchange
 * @param {String} cartId - cartId to apply setUserCurrency
 * @param {String} [cartToken] - Token for cart, if it's anonymous
 * @param {String} userCurrency - userCurrency to set to cart
 * @return {Number} update result
 */
export default function setUserCurrency(cartId, cartToken, userCurrency) {
  check(cartId, String);
  check(cartToken, Match.Maybe(String));
  check(userCurrency, String);

  const { cart } = getCart(cartId, { cartToken, throwIfNotFound: true });

  const userCurrencyString = {
    userCurrency
  };

  let selector;
  let update;

  if (cart.billing) {
    selector = {
      "_id": cartId,
      "billing._id": cart.billing[0]._id
    };
    update = {
      $set: {
        "billing.$.currency": userCurrencyString
      }
    };
  } else {
    selector = {
      _id: cartId
    };
    update = {
      $addToSet: {
        billing: {
          currency: userCurrencyString
        }
      }
    };
  }

  // add / or set the shipping address
  try {
    Collections.Cart.update(selector, update);
  } catch (error) {
    Logger.error(error);
    throw new Meteor.Error("server-error", "An error occurred adding the currency");
  }

  // Calculate discounts
  Hooks.Events.run("afterCartUpdateCalculateDiscount", cart._id);

  return true;
}
