// Reaction Globals
//
// These should all be removed. PR's happily accepted.
//
/* eslint "no-extend-native": [2, {"exceptions": ["String"]}] */
/* eslint "no-alert": 0 */

/**
 * String.prototype.toCamelCase
 * @summary special toCamelCase for converting a string to camelCase for use with i18n keys
 * @return {String} camelCased string
 */
String.prototype.toCamelCase = function () {
  let s;
  s = this.replace(/([^a-zA-Z0-9_\- ])|^[_0-9]+/g, "").trim().toLowerCase();
  s = s.replace(/([ -]+)([a-zA-Z0-9])/g, function (a, b, c) {
    return c.toUpperCase();
  });
  s = s.replace(/([0-9]+)([a-zA-Z])/g, function (a, b, c) {
    return b + c.toUpperCase();
  });
  return s;
};

/**
 * toggleSession
 * quick and easy snippet for toggling sessions
 * @param {String} sessionVariable - string name, see http://docs.meteor.com/#/basic/session
 * @param {String} positiveState - optional, if is is positiveState, set opposite
 * @return {Object} return session value
 */
this.toggleSession = function (sessionVariable, positiveState) {
  let session;
  session = Session.get(sessionVariable);
  positive = positiveState || true;
  if (_.isEqual(positive, session)) {
    Session.set(sessionVariable, false);
  } else {
    Session.set(sessionVariable, positive);
  }
  return Session.get(sessionVariable);
};


/**
 * locateUser
 * @return {Object} set and return session address based on browser latitude, longitude
 */
this.locateUser = function () {
  function successFunction(position) {
    let lat = position.coords.latitude;
    let lng = position.coords.longitude;
    return Meteor.call("shop/locateAddress", lat, lng, function (error,
      address) {
      if (address) {
        return Session.set("address", address);
      }
    });
  }

  function errorFunction() {
    return Meteor.call("shop/locateAddress", function (error, address) {
      if (address) {
        return Session.set("address", address);
      }
    });
  }

  if (navigator.geolocation) {
    return navigator.geolocation.getCurrentPosition(successFunction,
      errorFunction);
  }
};

/**
 * getCardTypes
 * @summary determine the card type and return label
 * @todo needs i18n conversion?
 * @param {String} cardNumber - a credit card number
 * @return {String} card label, ie: visa
 */
this.getCardType = function (cardNumber) {
  let re = new RegExp("^4");
  if (cardNumber.match(re) !== null) {
    return "visa";
  }
  re = new RegExp("^(34|37)");
  if (cardNumber.match(re) !== null) {
    return "amex";
  }
  re = new RegExp("^5[1-5]");
  if (cardNumber.match(re) !== null) {
    return "mastercard";
  }
  re = new RegExp("^6011");
  if (cardNumber.match(re) !== null) {
    return "discover";
  }
  return "";
};

/**
 * getGuestLoginState
 * @summary determines if a guest checkout is enabled and the login state for users
 * @return {Boolean} true if authenticated user
 */
this.getGuestLoginState = function () {
  if (Meteor.userId() === "string" && ReactionCore.getShopId() && ReactionCore.allowGuestCheckout()) {
    let isGuestFlow = Session.equals("guestCheckoutFlow", true);
    let isGuest = Roles.userIsInRole(Meteor.userId(), "guest", ReactionCore.getShopId());
    let isAnonymous = Roles.userIsInRole(Meteor.userId(), "anonymous", ReactionCore
      .getShopId());
    if (!isGuestFlow && !isGuest && isAnonymous) {
      return false;
    } else if (!isGuestFlow && isGuest && !isAnonymous) {
      return true;
    }
  } else if (Session.equals("guestCheckoutFlow", true) && _.pluck(Meteor.user()
      .emails, "address")) {
    return true;
  }
  return false;
};
