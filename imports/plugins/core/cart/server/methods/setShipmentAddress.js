import Hooks from "@reactioncommerce/hooks";
import Logger from "@reactioncommerce/logger";
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { Cart } from "/lib/collections";
import Reaction from "/imports/plugins/core/core/server/Reaction";
import getCart from "/imports/plugins/core/cart/server/util/getCart";

/**
 * @method cart/setShipmentAddress
 * @memberof Cart/Methods
 * @summary Adds address book to cart shipping
 * @param {String} cartId - cartId to apply shipmentMethod
 * @param {String} [cartToken] - Token for cart, if it's anonymous
 * @param {Object} address - addressBook object
 * @return {Number} update result
 */
export default function setShipmentAddress(cartId, cartToken, address) {
  check(cartId, String);
  check(cartToken, Match.Maybe(String));
  Reaction.Schemas.Address.validate(address);

  const { cart } = getCart(cartId, { cartToken, throwIfNotFound: true });

  let selector;
  let update;
  let updated = false; // if we update inline set to true, otherwise fault to update at the end
  // We have two behaviors depending on if we have existing shipping records and if we
  // have items in the cart.
  if (cart.shipping && cart.shipping.length > 0 && cart.items && cart.items.length > 0) {
    // if we have shipping records and cart.items, update each one by shop
    const shopIds = Object.keys(cart.getItemsByShop());
    shopIds.forEach((shopId) => {
      selector = {
        "_id": cartId,
        "shipping.shopId": shopId
      };

      update = {
        $set: {
          "shipping.$.address": address
        }
      };
      try {
        Cart.update(selector, update);
        updated = true;
      } catch (error) {
        Logger.error(error, "An error occurred adding the address");
        throw new Meteor.Error(error, "An error occurred adding the address");
      }
    });
  } else if (!cart.items || cart.items.length === 0) {
    // if no items in cart just add or modify one record for the carts shop
    // add a shipping record if it doesn't exist
    if (!cart.shipping) {
      selector = {
        _id: cartId
      };
      update = {
        $push: {
          shipping: {
            address,
            shopId: cart.shopId
          }
        }
      };

      try {
        Cart.update(selector, update);
        updated = true;
      } catch (error) {
        Logger.error(error);
        throw new Meteor.Error("server-error", "An error occurred adding the address");
      }
    } else {
      // modify an existing record if we have one already
      selector = {
        "_id": cartId,
        "shipping.shopId": cart.shopId
      };

      update = {
        $set: {
          "shipping.$.address": address
        }
      };
    }
  } else {
    // if we have items in the cart but we didn't have existing shipping records
    // add a record for each shop that's represented in the items
    const shopIds = Object.keys(cart.getItemsByShop());
    shopIds.forEach((shopId) => {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          shipping: {
            address,
            shopId
          }
        }
      };
    });
  }
  if (!updated) {
    // if we didn't do one of the inline updates, then run the update here
    try {
      Cart.update(selector, update);
    } catch (error) {
      Logger.error(error);
      throw new Meteor.Error("server-error", "An error occurred adding the address");
    }
  }

  try {
    Meteor.call("shipping/updateShipmentQuotes", cartId);
  } catch (error) {
    Logger.error(`Error calling shipping/updateShipmentQuotes method in setShipmentAddress method for cart with ID ${cartId}`, error);
  }

  Hooks.Events.run("afterCartUpdateCalculateDiscount", cartId);

  if (typeof cart.workflow !== "object") {
    throw new Meteor.Error(
      "server-error",
      "Cart workflow object not detected."
    );
  }

  // ~~it's ok for this to be called multiple times~~
  // call it only once when we at the `checkoutAddressBook` step
  if (typeof cart.workflow.workflow === "object" &&
    cart.workflow.workflow.length < 2) {
    Meteor.call(
      "workflow/pushCartWorkflow", "coreCartWorkflow",
      "coreCheckoutShipping", cart._id
    );
  }

  // if we change default address during further steps, we need to revert
  // workflow back to `coreCheckoutShipping` step
  if (typeof cart.workflow.workflow === "object" &&
    cart.workflow.workflow.length > 2) { // "2" index of
    // `coreCheckoutShipping`
    Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping", cart._id);
  }

  return true;
}
