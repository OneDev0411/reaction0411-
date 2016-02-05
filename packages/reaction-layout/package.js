Package.describe({
  summary: "Reaction Commerce layout templates",
  name: "reactioncommerce:reaction-layout",
  version: "1.0.0",
  documentation: "README.md"
});

Npm.depends({
  "postcss": "5.0.14",
  "postcss-js": "0.1.1",
  "autoprefixer": "6.3.1",
  "css-annotation": "0.6.0"
});

Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.2.1");

  // meteor base packages
  api.use("meteor-base");
  api.use("mongo");
  api.use("ecmascript");
  api.use("es5-shim");
  api.use("blaze-html-templates");
  api.use("session");
  api.use("jquery");
  api.use("tracker");

  // meteor add-on packages
  api.use("underscore");
  api.use("logging");
  api.use("reload");
  api.use("random");
  api.use("ejson");
  api.use("check");
  api.use("http");
  api.use("reactive-var");
  api.use("reactive-dict");

  // community packages
  api.use("reactioncommerce:core@0.12.0");
  api.use("reactioncommerce:reaction-ui@0.4.0");
  api.use("juliancwirko:s-alert@3.1.4");
  api.use("juliancwirko:s-alert-stackslide@3.1.3");
  api.use("kevohagan:sweetalert@1.0.0");


  api.addFiles("server/register.js", "server");
  api.addFiles("server/processTheme.js", "server");

  // Theme Templates
  api.addFiles("client/templates/theme/theme.js", "client");
  api.addFiles("client/templates/theme/theme.html", "client");

  api.addFiles("client/templates/settings/settings.html", "client");
  api.addFiles("client/templates/settings/settings.js", "client");
  api.addFiles("client/templates/settings/settings.less", "client");

  api.addFiles("client/templates/dashboard/dashboard.html", "client");

  // layout templates
  api.addFiles("client/templates/layout/layout.html", "client");
  api.addFiles("client/templates/layout/layout.js", "client");

  api.addFiles("client/templates/layout/admin/admin.html", "client");
  api.addFiles("client/templates/layout/admin/admin.js", "client");

  api.addFiles("client/templates/layout/header/header.html", "client");
  api.addFiles("client/templates/layout/header/header.js", "client");

  api.addFiles("client/templates/layout/header/menu/button.html", "client");

  api.addFiles("client/templates/layout/header/i18n/i18n.html", "client");
  api.addFiles("client/templates/layout/header/i18n/i18n.js", "client");

  api.addFiles("client/templates/layout/header/brand/brand.html", "client");

  api.addFiles("client/templates/layout/footer/footer.html", "client");

  api.addFiles("client/templates/layout/alerts/inlineAlerts.js", "client");
  api.addFiles("client/templates/layout/alerts/reactionAlerts.js", "client");
  api.addFiles("client/templates/layout/alerts/alerts.html", "client");
  api.addFiles("client/templates/layout/alerts/alerts.js", "client");

  api.addFiles("client/templates/layout/loading/loading.html", "client");
  api.addFiles("client/templates/layout/notFound/notFound.html", "client");
  api.addFiles("client/templates/layout/notice/unauthorized.html", "client");

  api.export("Alerts", ["client"]);
});
