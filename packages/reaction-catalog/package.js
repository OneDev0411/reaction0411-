Package.describe({
  summary: "Reaction Catalog",
  name: "reactioncommerce:reaction-catalog",
  version: "0.2.1",
  git: "https://github.com/reactioncommerce/reaction-catalog.git"
});


Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.2.1");

  // meteor base packages
  // TODO: @Aaron, please, check this deps list.
  api.use("meteor-base");
  api.use("mongo");
  api.use("reload");
  api.use("random");
  api.use("ejson");
  api.use("check");
  api.use("ecmascript");
  api.use("reactioncommerce:core@0.12.0");

  api.addFiles("common/helpers.js"); // product common helpers
  api.addFiles("server/methods.js", ["server"]); // products server methods
  api.addFiles("server/register.js", ["server"]); // register as a reaction package
});

Package.onTest(function (api) {
  api.use("sanjo:jasmine@0.21.0");
  api.use("random");
  api.use("underscore");
  api.use("velocity:html-reporter@0.9.1");
  api.use("velocity:console-reporter@0.1.4");

  api.use("reactioncommerce:reaction-collections@2.0.1");
  api.use("reactioncommerce:reaction-factories@0.4.2");
  api.use("reactioncommerce:core@0.12.0");
  api.use("reactioncommerce:reaction-catalog");

  api.addFiles("tests/jasmine/server/integration/products.js", "server");
});
