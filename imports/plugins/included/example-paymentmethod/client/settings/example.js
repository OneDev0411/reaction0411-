import { Template } from "meteor/templating";
import { Reaction } from "/client/api";
import { Packages } from "/lib/collections";
import { ExamplePackageConfig } from "../../lib/collections/schemas";

import "./example.html";

Template.exampleSettings.onCreated(() => {
  console.log("exampleSettings created");
});

Template.exampleSettings.helpers({
  ExamplePackageConfig() {
    console.log("ExamplePackageConfig helper");
    return ExamplePackageConfig;
  },
  packageData() {
    console.log("finding example package data");
    return Packages.findOne({
      name: "example-paymentmethod",
      shopId: Reaction.getShopId()
    });
  }
});


Template.example.helpers({
  packageData: function () {
    return Packages.findOne({
      name: "example-paymentmethod",
      shopId: Reaction.getShopId()
    });
  }
});

Template.example.events({
  "click [data-event-action=showExampleSettings]": function () {
    Reaction.showActionView();
  }
});

AutoForm.hooks({
  "example-update-form": {
    onSuccess: function (operation, result, template) {
      Alerts.removeSeen();
      return Alerts.add("Example Payment Method settings saved.", "success");
    },
    onError: function (operation, error, template) {
      Alerts.removeSeen();
      return Alerts.add("Example Payment Method settings update failed. " + error, "danger");
    }
  }
});
