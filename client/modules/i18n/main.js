import i18next from "i18next";
import moment from "moment";
import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { Reaction } from "/client/api";
import { Shops } from "/lib/collections";

//
// Reaction i18n Translations, RTL and Currency Exchange Support
//

/**
 * getBrowserLanguage
 * @summary detects device default language
 * @return {String} language code
 */
export function getBrowserLanguage() {
  if (typeof navigator.languages !== "undefined") {
    if (~navigator.languages[0].indexOf("-")) {
      return navigator.languages[0].split("-")[0];
    } else if (~navigator.languages[0].indexOf("_")) {
      return navigator.languages[0].split("_")[0];
    }
    return navigator.languages[0];
  }
  return navigator.language || navigator.browserLanguage;
}

/**
 * getLabelsFor
 * get Labels for simple.schema keys
 * @param  {Object} schema - schema
 * @param  {String} name - name
 * @return {Object} return schema label object
 */
export function getLabelsFor(schema, name) {
  const labels = {};
  // loop through all the rendered form fields and generate i18n keys
  for (const fieldName of schema._schemaKeys) {
    const i18nKey = name.charAt(0).toLowerCase() + name.slice(1) + "." +
      fieldName
        .split(".$").join("");
    // translate autoform label
    const t = i18next.t(i18nKey);
    if (new RegExp("string").test(t) !== true && t !== i18nKey) {
      if (t) {
        labels[fieldName] = t;
      }
    }
  }
  return labels;
}

/**
 * getMessagesFor
 * get i18n messages for autoform messages
 * currently using a globalMessage namespace only*
 * (1) Use schema-specific message for specific key
 * (2) Use schema-specific message for generic key
 * (3) Use schema-specific message for type
 * @todo implement messaging hierarchy from simple-schema
 * @return {Object} returns i18n translated message for schema labels
 */
export function getMessagesFor() {
  const messages = {};
  for (const message in SimpleSchema._globalMessages) {
    if ({}.hasOwnProperty.call(SimpleSchema._globalMessages, message)) {
      const i18nKey = `globalMessages.${message}`;
      const t = i18next.t(i18nKey);
      if (new RegExp("string").test(t) !== true && t !== i18nKey) {
        messages[message] = t;
      }
    }
  }
  return messages;
}

/**
 *  set language and autorun on change of language
 *  initialize i18n and load data resources for the current language and fallback "EN"
 *
 */
export const i18nextDep = new Tracker.Dependency();
export const localeDep = new Tracker.Dependency();
export const currencyDep = new Tracker.Dependency();

Meteor.startup(() => {
  Tracker.autorun(function (c) {
    let merchantShopsReadyOrSkipped = false;

    // Choose shopSubscription based on marketplace settings
    if (Reaction.marketplaceEnabled && Reaction.merchantLanguage) {
      merchantShopsReadyOrSkipped = Reaction.Subscriptions.MerchantShops.ready();
    } else {
      merchantShopsReadyOrSkipped = true;
    }

    // setting local and active packageNamespaces
    // packageNamespaces are used to determine i18n namespace
    if (Reaction.Subscriptions.PrimaryShop.ready() && merchantShopsReadyOrSkipped) {
      const primaryShopId = Reaction.getPrimaryShopId();
      // every package gets a namespace, fetch them and export
      // get packages from primaryShopId as merchant shops
      // may not have all packages

      // By default, use the primaryShopId to get locale
      // If markteplace is enabled and set to use merchant currencies,
      // get the active shopId
      let localeShopId = primaryShopId;
      if (Reaction.marketplaceEnabled && Reaction.merchantCurrency) {
        localeShopId = Reaction.getShopId();
      }

      // use i18n detected language to getLocale info
      Meteor.call("shop/getLocale", (error, result) => {
        if (result) {
          const locale = result;
          locale.language = getBrowserLanguage();
          moment.locale(locale.language);
          // flag in case the locale currency isn't enabled
          locale.currencyEnabled = locale.currencyEnabled;
          const user = Meteor.user();
          if (user && user.profile && user.profile.currency) {
            localStorage.setItem("currency", user.profile.currency);
          } else {
            const localStorageCurrency = localStorage.getItem("currency");
            if (!localStorageCurrency) {
              if (locale.currencyEnabled) {
                // in case of multiple locale currencies
                const primaryCurrency = locale.locale.currency.split(",")[0];
                localStorage.setItem("currency", primaryCurrency);
              } else {
                const shop = Shops.findOne({
                  _id: localeShopId
                }, {
                  fields: {
                    currency: 1
                  }
                });
                if (shop) {
                  localStorage.setItem("currency", shop.currency);
                }
              }
            }
          }

          Reaction.Locale.set(locale);
          localeDep.changed();

          // Stop the tracker
          c.stop();
        }
      });
    }
  });
});

export default i18next;
