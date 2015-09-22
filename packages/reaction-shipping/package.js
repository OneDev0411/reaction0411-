Package.describe({
  summary: "Reaction Shipping - Flat Rate shipping for Reaction Commerce",
  name: "reactioncommerce:reaction-shipping",
  version: "0.6.0",
  git: "https://github.com/reactioncommerce/reaction-shipping.git"
});


Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.2');

  // meteor base packages
  api.use("standard-minifiers");
  api.use("mobile-experience");
  api.use("meteor-base");
  api.use("mongo");
  api.use("blaze-html-templates");
  api.use("session");
  api.use("jquery");
  api.use("tracker");
  api.use("logging");
  api.use("reload");
  api.use("random");
  api.use("ejson");
  api.use("spacebars");
  api.use("check");

  // meteor add-on packages

  api.use("templating");
  api.use("less");
  api.use("reactioncommerce:core@0.8.0",["client","server"]);

  api.addFiles([
    "common/collections.js", // any unique collections
    "common/routing.js" // add routing for administration templates
  ],["client","server"]);

  api.addFiles("server/register.js",["server"]); // register as a reaction package
  api.addFiles("server/methods.js",["server"]); // server methods
  api.addFiles("server/fixtures.js",["server"]); // fixtures
  api.addAssets('private/data/Shipping.json', 'server');// fixture data

  api.addFiles([
    // admin screens
    "client/templates/shipping.html",
    "client/templates/shipping.js",
    "client/templates/shipping.less",
    // checkout templates
    "client/templates/cart/checkout/shipping/shipping.html",
    "client/templates/cart/checkout/shipping/shipping.js"
  ],
  ["client"]);
});
