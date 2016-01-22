Package.describe({
  summary: "Reaction UI Header Navigation",
  name: "reactioncommerce:reaction-ui-navbar",
  version: "0.1.0",
  documentation: "README.md"
});

Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.2");

  // meteor base packages
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
  api.use("ecmascript");
  api.use("spacebars");
  api.use("check");
  api.use("less");
  api.use("reactive-dict");

  // meteor add-on packages
  api.use("reactioncommerce:reaction-ui@0.1.0");
  api.use("reactioncommerce:core-theme@2.0.1");

  // api.addFiles("client/components/components.jsx", "client");
  // api.addFiles("client/helpers/helpers.js", "client");
  // api.addFiles("client/helpers/tags.js", "client");


  api.addFiles("client/components/brand/brand.html", "client");

  api.addFiles("client/components/i18n/i18n.html", "client");
  api.addFiles("client/components/i18n/i18n.js", "client");

  api.addFiles("client/components/navbar/navbar.html", "client");
  api.addFiles("client/components/navbar/navbar.js", "client");
  api.addFiles("client/components/navbar/navbar.less", "client");

  // api.addFiles("client/styles/base.less", "client");
});
