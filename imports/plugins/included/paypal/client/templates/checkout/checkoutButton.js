import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import { Cart } from "/lib/collections";
import { PaypalClientAPI } from "../../lib/paypalRestApi";

/**
 * PayPal Checkout Button
 *
 * This is the PayPal Express Checkout button that displays opens a popup,
 * provided by paypal.
 */

/**
 * Setup PayPal Express Checkout
 * @param  {Element} element DOM element
 * @param  {element} expressCheckoutSettings checkout settings
 * @return {undefined} no return value
 */
function doSetup(element, expressCheckoutSettings) {
  Session.set("paypalExpressSetup", true);
  paypal.checkout.setup(expressCheckoutSettings.merchantId, {
    environment: expressCheckoutSettings.mode,
    button: element,
     // Blank function to disable default paypal onClick functionality
    click: function () {}
  });
}

/**
 * Checkout - Open PayPal Express popup
 * @return {undefined} no return value
 */
function checkout() {
  paypal.checkout.initXO();
  const cart = Cart.findOne();
  if (!cart) {
    return undefined;
  }

  return Meteor.call("getExpressCheckoutToken", cart._id, function (error, token) {
    if (error) {
      const msg = (error !== null ? error.error : void 0) || i18next.t("checkoutPayment.processingError", "There was a problem with your payment.");
      Alerts.add(msg, "danger", {
        placement: "paymentMethod"
      });
      return paypal.checkout.closeFlow();
    }
    const url = paypal.checkout.urlPrefix + token;
    return paypal.checkout.startFlow(url);
  });
}

/**
 * Validate express checkout settings object
 * @param  {Object} settings Object containing "merchantId" and "mode":
 * @return {Boolean} true if valid, false otherwise
 */
function expressCheckoutSettingsValid(settings) {
  return _.isEmpty(settings.merchantId) === false && _.isEmpty(settings.mode) === false;
}

/**
 * PayPal checkout onCreate
 * @param  {Function} function to execute when template is created
 * @return {undefined} no return value
 */
Template.paypalCheckoutButton.onCreated(function () {
  PaypalClientAPI.load();
  this.state = new ReactiveDict();
  this.state.setDefault({
    isConfigured: false
  });
});

/**
 * PayPal checkout onRendered
 * @param  {Function} function to execute when template is rendered
 * @return {undefined} no return value
 */
Template.paypalCheckoutButton.onRendered(function () {
  const element = this.$(".js-paypal-express-checkout")[0];

  this.autorun(() => {
    if (PaypalClientAPI.loaded()) {
      const expressCheckoutSettings = Session.get("expressCheckoutSettings");

      if (expressCheckoutSettingsValid(expressCheckoutSettings)) {
        this.state.set("isConfigured", true);
        doSetup(element, expressCheckoutSettings);
      } else {
        this.state.set("isConfigured", false);
      }
    }
  });
});

/**
 * PayPal checkout button helpers
 */
Template.paypalCheckoutButton.helpers({

  /**
   * Check for proper configuration of PayPal Express Checkout settings.
   * This function only validates that the required settings exist and are not empty.
   * @return {Boolean} true if properly configured, false otherwise
   */
  isConfigured() {
    return Template.instance().state.equals("isConfigured", true);
  }
});

/**
 * PayPal checkout button events
 */
Template.paypalCheckoutButton.events({

  /**
   * Click Event: Express Checkout Button
   * @return {undefined} no return value
   */
  "click .js-paypal-express-checkout"() {
    return checkout();
  }
});
