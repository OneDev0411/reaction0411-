import { Template } from "meteor/templating";
import { Reaction, i18next } from "/client/api";
import { Packages } from "/lib/collections";
import { StripeConnectPackageConfig } from "../../lib/collections/schemas";

import "./settings.html";

Template.stripeConnectSettings.helpers({
  StripeConnectPackageConfig() {
    return StripeConnectPackageConfig;
  },
  packageData() {
    return Packages.findOne({
      name: "reaction-stripe-connect",
      shopId: Reaction.getShopId()
    });
  }
});

 Template.stripeConnect.helpers({
   packageData() {
     return Packages.findOne({
       name: "reaction-stripe-connect",
       shopId: Reaction.getShopId()
     });
   }
 });

 Template.stripeConnect.events({
   "click [data-event-action=showStripeConnectSettings]"() {
     Reaction.showActionView();
   }
 });

AutoForm.hooks({
  "stripe-connect-update-form": {
    onSuccess: function () {
      return Alerts.toast(i18next.t("admin.settings.saveSuccess"), "success");
    },
    onError: function () {
      return Alerts.toast(`${i18next.t("admin.settings.saveFailed")} ${error}`, "error");
    }
  }
});

 Template.stripeConnectRedirect.onCreated( function() {
   //grabs values stripe passes back in the url as the params
   this.autorun(() => {
     FlowRouter.route("/dashboard/connect", {
       name: "StripeConnect.url",
       action(params, queryParams) {
         console.log("Gathering Stripe Connect URL parameters.");
         
         Meteor.call("stripeConnect/saveSellerParams", Reaction.getShopId(), params, queryParams);
       }
     });
   });
 });
