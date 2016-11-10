import { Shops } from "/lib/collections";
import { Template } from "meteor/templating";

const openClassName = "in";

Template.corePaymentMethods.onCreated(function () {
  // Set the default paymentMethod
  // Note: we do this once, so if the admin decides to change the default payment method
  // while a user is trying to checkout, they wont get a jarring experience.
  const shop = Shops.findOne();

  this.state = new ReactiveDict();
  this.state.setDefault({
    defaultPaymentMethod: shop.defaultPaymentMethod || "none"
  });
});

Template.corePaymentMethods.helpers({
  isOpen(current) {
    const instance = Template.instance();
    const state = instance.state;
    const name = current.packageName;
    const priority = current.priority;

    if (state.equals("defaultPaymentMethod", name) || priority === "0" && state.equals("defaultPaymentMethod", "none")) {
      return openClassName;
    }
    return "";
  }
});
