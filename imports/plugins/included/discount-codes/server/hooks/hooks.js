import { Reaction, Logger, MethodHooks } from "/server/api";
import { Packages } from "/lib/collections";

// // Meteor.after to call after
MethodHooks.after("discounts/calculate", function (options) {
  const result = options.result || {};
  const pkg = Packages.findOne({
    name: "discount-codes",
    shopId: Reaction.getShopId()
  });

  // check if plugin is enabled and this calculation method is enabled
  if (pkg && pkg.enabled === true && pkg.settings.codes.enabled === true) {
    Logger.info("Discount codes triggered on cartId:", options.arguments[0]);
  }

  // Default return value is the return value of previous call in method chain
  // or an empty object if there's no result yet.
  return result;
});
