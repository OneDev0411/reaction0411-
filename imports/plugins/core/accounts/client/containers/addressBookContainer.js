import React, { Component } from "react";
import { compose } from "recompose";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { i18next } from "/client/api";
import { Countries } from "/client/collections";
import * as Collections from "/lib/collections";
import { registerComponent, composeWithTracker } from "@reactioncommerce/reaction-components";
import AddressBook from "../components/addressBook";

/**
 * @method updateAddress
 * @summary helper function that updates an address in the account's addressBook via a meteor method.
 * @since 2.0.0
 * @param {Object} address - address to be updated.
 * @param{String} property - property to be updated.
 * @return {Promise}
 */
function updateAddress(address, property) {
  return new Promise((resolve, reject) => {
    Meteor.call("accounts/addressBookUpdate", address, null, property, (error, result) => {
      if (error || !result) {
        reject(i18next.t("addressBookGrid.somethingWentWrong", { err: error.message }));
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * @method removeAddress
 * @summary helper function that updates an address in the account's addressBook via a meteor method.
 * @since 2.0.0
 * @param {String} _id - _id of address to be removed.
 * @return {Promise}
 */
function removeAddress(_id) {
  return new Promise((resolve, reject) => {
    Meteor.call("accounts/addressBookRemove", _id, (error, result) => {
      if (error || !result) {
        reject(i18next.t("addressBookGrid.cantRemoveThisAddress", { err: error.message }));
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * @method addAddress
 * @summary helper function that adds an address in the account's addressBook via a meteor method.
 * @since 2.0.0
 * @param {Object} address - address to be added.
 * @return {Promise}
 */
function addAddress(address, validateAddress = true) {
  return new Promise((resolve, reject) => {
    // This address was tried for validation
    if (validateAddress) {
      address.validationAttempted = true;
      Meteor.call("accounts/validateAddress", address, (error, result) => {
        if (error || !result) {
          let errorMessage = (error && error.message) || "Validation Failed";
          if (error && error.error === "validation-error" && Array.isArray(error.details) && error.details.length) {
          // Add details of first invalid field from SimpleSchema
            errorMessage = error.details[0].message;
          }
          reject(i18next.t("addressBookAdd.failedToAddAddress", { err: errorMessage }));
          return;
        } else if (result && !result.validated === false) {
          resolve(result);
          return;
        }
        Meteor.call("accounts/addressBookAdd", address, (err, res) => {
          if (err || !res) {
            reject(i18next.t("addressBookAdd.failedToAddAddress", { err: err.message }));
          } else {
            resolve(res);
          }
        });
      });
    } else {
      Meteor.call("accounts/addressBookAdd", address, (err, res) => {
        if (err || !res) reject(i18next.t("addressBookAdd.failedToAddAddress", { err: err.message }));
        if (res) resolve(res);
      });
    }
  });
}

/**
 * @method onError
 * @summary helper function that shows an error message in an alert toast.
 * @since 2.0.0
 * @param {Object} errorMessage - error message object.
 */
function onError(errorMessage) {
  Alerts.toast(errorMessage, "error");
}

const wrapComponent = (Comp) => (
  class AddressBookContainer extends Component {
    static propTypes = Comp.PropTypes;

    constructor(props) {
      super(props);
      console.log("***************** AddressBookContainer is made again ******************");
    }

    render() {
      return (
        <Comp
          {...this.props}
          addAddress={addAddress}
          updateAddress={updateAddress}
          removeAddress={removeAddress}
          onError={onError}
        />
      );
    }
  }
);

function composer(props, onData) {
  const account = Collections.Accounts.findOne({ _id: Meteor.userId() });
  console.log(account, account.profile.addressBook);
  const { addressBook } = account.profile;
  const countries = Countries.find().fetch();
  const template = Template.instance();
  const { data } = template || { data: undefined };
  const { heading: templateHeading } = data || { heading: undefined };
  const shop = Collections.Shops.findOne();
  const shopCountries = shop.locales.countries;

  const regionsByCountry = {};
  Object.keys(shopCountries).forEach((key) => {
    const { states } = shopCountries[key] || {};
    const regions = [];
    if (states) {
      // states is an object that needs to be convered
      // to an array of region labels and values
      Object.keys(states).forEach((i) => {
        regions.push({
          label: states[i].name,
          value: i
        });
      });
    }
    regionsByCountry[key] = regions;
  });

  let heading;
  // AddressBook heading will be different in different views
  // If the view template that's using the AddressBook has a
  // heading object, set it as the AddressBook heading
  if (templateHeading) {
    heading = templateHeading;
  } else {
    // default AddressBook heading
    heading = {
      defaultValue: "Address Book",
      i18nKey: "accountsUI.addressBook"
    };
  }

  onData(null, {
    addressBook,
    countries,
    heading,
    regionsByCountry
  });
}

registerComponent("AddressBookContainer", AddressBook, [
  composeWithTracker(composer),
  wrapComponent
]);

export default compose(
  composeWithTracker(composer),
  wrapComponent
)(AddressBook);
