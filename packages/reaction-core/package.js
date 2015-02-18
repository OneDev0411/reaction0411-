Package.describe({
  summary: "Core - Reaction Commerce ecommerce Meteor package",
  name: "reactioncommerce:core",
  version: "0.5.0",
  git: "https://github.com/reactioncommerce/reaction-core.git"
});

Package._transitional_registerBuildPlugin({
  name: 'theme-configurator',
  use: [
    'underscore',
    'reactioncommerce:core-theme@1.2.2'
  ],
  sources: [
    'server/buildtools/module-definitions.js',
    'server/buildtools/distributed-configuration.js',
    'server/buildtools/theme-configurator.js'
  ],
  npmDependencies: {}
});

Package.onUse(function (api) {

  if (api.versionsFrom) {
    api.versionsFrom('METEOR@1.0');
    // Meteor Version 1.0 +
    //core meteor packages
    api.use("meteor-platform");
    api.use("accounts-base");
    api.use("accounts-password");
    api.use("accounts-ui-unstyled");
    api.use("less");
    api.use("http");
    api.use("coffeescript");
    api.use("underscore");
    api.use("blaze");
    api.use("jquery");
    api.use("email");
    api.use("check");
    api.use("browser-policy");
    api.use("amplify@1.0.0");

    //community packages
    api.use("nemo64:bootstrap@3.3.1_1","client");
    api.use("nemo64:bootstrap@3.3.1_1","server", {'weak': 1});
    api.use("d3js:d3@3.4.13");
    api.use("fortawesome:fontawesome@4.2.0_2");
    api.use("mrt:underscore-string-latest@2.3.3");
    api.use("aldeed:geocoder@0.3.3");
    api.use("aldeed:collection2@2.3.2");
    api.use("aldeed:simple-schema@1.3.0");
    api.use("aldeed:autoform@4.2.2");
    api.use("aldeed:template-extension@3.1.1","client");
    api.use("iron:router@1.0.7");
    api.use("prinzdezibel:accounts-guest@0.1.3");
    api.use("ongoworks:speakingurl@1.0.5");
    api.use("ongoworks:pdf@1.1.0");
    api.use("ongoworks:bunyan-logger@1.0.0");
    api.use("ongoworks:security@1.0.1");

    api.use("dburles:factory@0.3.7");
    api.use("anti:fake@0.4.1");
    api.use("matb33:collection-hooks@0.7.6");
    api.use("alanning:roles@1.2.13");
    api.use("cmather:handlebars-server@2.0.0","server");
    api.use("momentjs:moment@2.8.4", 'client');
    api.use("sacha:spin@2.0.4", "client");

    api.use("cfs:standard-packages@0.5.3");
    api.use("cfs:graphicsmagick@0.0.17");
    api.use("cfs:filesystem@0.1.1");
    api.use("cfs:gridfs@0.0.27");
    api.use("cfs:s3@0.1.1");
    api.use("cfs:ui@0.1.3");
    api.use("raix:ui-dropped-event@0.0.7");

    //implying these are reused in reaction packages
    api.imply("less");
    api.imply("amplify");
    api.imply("accounts-base");
    api.imply("ui");
    api.imply("browser-policy");

    api.imply("aldeed:collection2");
    api.imply("aldeed:simple-schema");
    api.imply("aldeed:autoform");
    api.imply("aldeed:template-extension");
    api.imply("iron:router");
    api.imply("cfs:graphicsmagick");
    api.imply("cfs:filesystem");
    api.imply("cfs:gridfs");
    api.imply("cfs:s3");
    api.imply("raix:ui-dropped-event");
    api.imply("matb33:collection-hooks");
    api.imply("alanning:roles");
    api.imply("momentjs:moment", ["client"]);
    api.imply("sacha:spin" ["client"]);
    api.imply("dburles:factory");
    api.imply("ongoworks:speakingurl");
    api.imply("ongoworks:security");

  // Pre-0.9.0
  } else {
    throw new Error("Meteor upgrade required.")
  }

  // Core Reaction files
  api.addFiles([
    "lib/statemachine/state-machine.js",
    "common/packageGlobals.js",
    "common/common.coffee",
    "common/helpers.coffee",
    "common/routing.coffee",
    "common/schemas/packages.coffee",
    "common/schemas/users.coffee",
    "common/schemas/shops.coffee",
    "common/schemas/shipping.coffee",
    "common/schemas/products.coffee",
    "common/schemas/tags.coffee",
    "common/schemas/cart.coffee",
    "common/schemas/orders.coffee",
    "common/schemas/translations.coffee",
    "common/schemas/taxes.coffee",
    "common/schemas/discounts.coffee",
    "common/collections/collections.coffee",
    "common/collections/collectionFS.coffee",
    "common/hooks/hooks.coffee"
  ], ["client", "server"]);

  api.addFiles([
    "server/app.coffee",
    "server/register.coffee",
    "server/security.coffee",
    "server/publications.coffee",
    "server/fixtures.coffee",
    "server/factories.coffee",
    "server/methods/methods.coffee",
    "server/methods/cart/cart.coffee",
    "server/methods/cart/checkout/checkout.coffee",
    "server/methods/orders/orders.coffee",
    "server/methods/products/products.coffee",
    "server/methods/accounts/accounts.coffee",
    "server/emailTemplates/shopMemberInvite.html",
    "server/emailTemplates/shopMemberNotification.html"
  ], ["server"]);

  api.addFiles([
    "lib/i18next-1.7.3/i18next-1.7.3.js",

    "lib/swiper/idangerous.swiper.css",
    "lib/swiper/idangerous.swiper.js",

    "lib/jquery-autosize/jquery.autosize.js",
    "lib/imagesLoaded/imagesloaded.pkgd.js",

    "lib/jquery-ui/jquery-ui-1.10.4.custom.js",
    "lib/jquery-ui/jquery-ui-1.10.3.custom.css",
    "lib/jquery-collapsible/jquery.collapsible.js",
    "lib/jquery-serialize/jquery.serialize-hash.coffee",
    "lib/jquery-cookie/jquery.cookie.js",

    "lib/openexchangerates/money.js",
    "lib/openexchangerates/accounting.js",

    "client/subscriptions.coffee",
    "client/app.coffee",

    "client/helpers/helpers.coffee",
    "client/helpers/i18n/i18n.coffee",
    "client/helpers/metadata.coffee",
    "client/helpers/spacebars.coffee",

    "client/workflows/cart/workflow.coffee",
    "client/workflows/orders/workflow.coffee",

    "client/templates/layout/layout.html",
    "client/templates/layout/layout.coffee",

    "client/templates/layout/header/header.html",
    "client/templates/layout/header/header.coffee",

    "client/templates/layout/header/tags/tags.html",
    "client/templates/layout/header/tags/tags.coffee",

    "client/templates/layout/header/i18n/i18n.html",
    "client/templates/layout/header/i18n/i18n.coffee",

    "client/templates/layout/header/brand/brand.html",

    "client/templates/layout/footer/footer.html",

    "client/templates/layout/alerts/bootstrap-alerts.coffee",
    "client/templates/layout/alerts/alerts.html",
    "client/templates/layout/alerts/alerts.coffee",

    "client/templates/layout/loading/loading.html",
    "client/templates/layout/notFound/notFound.html",

    "client/templates/layout/notice/unauthorized.html",
    "client/templates/layout/notice/shopNotFound.html",

    "client/templates/accounts/accounts-ui/login_buttons.html",
    "client/templates/accounts/accounts-ui/login_buttons_dialogs.html",
    "client/templates/accounts/accounts-ui/login_buttons_dropdown.html",
    "client/templates/accounts/accounts-ui/login_buttons_dropdown.coffee",
    "client/templates/accounts/accounts-ui/login_buttons_single.html",
    "client/templates/accounts/accounts-ui/accounts-ui.coffee",

    "client/templates/accounts/accounts.html",
    "client/templates/accounts/accounts.coffee",

    "client/templates/accounts/inline/inline.html",
    "client/templates/accounts/inline/inline.coffee",

    "client/templates/accounts/dropdown/dropdown.html",
    "client/templates/accounts/dropdown/dropdown.coffee",

    "client/templates/cart/cartDrawer/cartDrawer.html",
    "client/templates/cart/cartDrawer/cartDrawer.coffee",

    "client/templates/cart/cartDrawer/cartItems/cartItems.html",
    "client/templates/cart/cartDrawer/cartItems/cartItems.coffee",

    "client/templates/cart/cartDrawer/cartSubTotals/cartSubTotals.html",
    "client/templates/cart/cartDrawer/cartSubTotals/cartSubTotals.coffee",

    "client/templates/cart/cartIcon/cartIcon.html",
    "client/templates/cart/cartIcon/cartIcon.coffee",

    "client/templates/cart/cartPanel/cartPanel.html",
    "client/templates/cart/cartPanel/cartPanel.coffee",

    "client/templates/cart/checkout/checkout.html",
    "client/templates/cart/checkout/checkout.coffee",

    "client/templates/cart/checkout/login/login.html",
    "client/templates/cart/checkout/login/login.coffee",

    "client/templates/cart/checkout/header/header.html",
    "client/templates/cart/checkout/header/header.coffee",

    "client/templates/cart/checkout/progressBar/progressBar.html",
    "client/templates/cart/checkout/progressBar/progressBar.coffee",

    "client/templates/cart/checkout/addressBook/addressBook.html",
    "client/templates/cart/checkout/addressBook/addressBook.coffee",

    "client/templates/cart/checkout/addressBook/add/add.html",
    "client/templates/cart/checkout/addressBook/add/add.coffee",

    "client/templates/cart/checkout/addressBook/edit/edit.html",
    "client/templates/cart/checkout/addressBook/edit/edit.coffee",

    "client/templates/cart/checkout/addressBook/form/form.html",
    "client/templates/cart/checkout/addressBook/form/form.coffee",

    "client/templates/cart/checkout/addressBook/grid/grid.html",
    "client/templates/cart/checkout/addressBook/grid/grid.coffee",

    "client/templates/cart/checkout/review/review.html",
    "client/templates/cart/checkout/review/review.coffee",

    "client/templates/cart/checkout/payment/payment.html",
    "client/templates/cart/checkout/payment/payment.coffee",

    "client/templates/cart/checkout/payment/methods/cards.html",
    "client/templates/cart/checkout/payment/methods/cards.coffee",

    "client/templates/cart/checkout/completed/completed.html",
    "client/templates/cart/checkout/completed/completed.coffee",

    "client/templates/cart/checkout/completed/orderLayout/orderLayout.html",
    "client/templates/cart/checkout/completed/orderLayout/orderLayout.coffee",

    "client/templates/cart/checkout/completed/orderLayout/orderItems/orderItems.html",
    "client/templates/cart/checkout/completed/orderLayout/orderItems/orderItems.coffee",

    "client/templates/cart/checkout/completed/orderLayout/orderSummary/orderSummary.html",
    "client/templates/cart/checkout/completed/orderLayout/orderSummary/orderSummary.coffee",

    "client/templates/cart/checkout/completed/pdfLayout/pdfLayout.html",
    "client/templates/cart/checkout/completed/pdfLayout/pdfLayout.coffee",

    "client/templates/cart/checkout/shipping/shipping.html",
    "client/templates/cart/checkout/shipping/shipping.coffee",

    "client/templates/dashboard/console/console.html",
    "client/templates/dashboard/console/console.coffee",

    "client/templates/dashboard/console/icon/icon.html",
    "client/templates/dashboard/console/icon/icon.coffee",

    "client/templates/dashboard/customers/customers.html",
    "client/templates/dashboard/customers/customers.coffee",

    "client/templates/dashboard/orders/orders.html",
    "client/templates/dashboard/orders/orders.coffee",

    "client/templates/dashboard/orders/widget/widget.html",
    "client/templates/dashboard/orders/widget/widget.coffee",

    "client/templates/dashboard/orders/details/detail.html",
    "client/templates/dashboard/orders/details/detail.coffee",

    "client/templates/dashboard/orders/social/orderSocial.html",
    "client/templates/dashboard/orders/social/orderSocial.coffee",

    "client/templates/dashboard/orders/stateHelpers/completed/completed.html",
    "client/templates/dashboard/orders/stateHelpers/completed/completed.coffee",

    "client/templates/dashboard/orders/stateHelpers/documents/documents.html",
    "client/templates/dashboard/orders/stateHelpers/documents/documents.coffee",

    "client/templates/dashboard/orders/stateHelpers/packing/packing.html",
    "client/templates/dashboard/orders/stateHelpers/packing/packing.coffee",

    "client/templates/dashboard/orders/stateHelpers/payment/payment.html",
    "client/templates/dashboard/orders/stateHelpers/payment/payment.coffee",

    "client/templates/dashboard/orders/stateHelpers/shipped/shipped.html",
    "client/templates/dashboard/orders/stateHelpers/shipped/shipped.coffee",

    "client/templates/dashboard/orders/stateHelpers/tracking/tracking.html",
    "client/templates/dashboard/orders/stateHelpers/tracking/tracking.coffee",

    "client/templates/dashboard/packages/packages.html",
    "client/templates/dashboard/packages/packages.coffee",

    "client/templates/dashboard/packages/grid/package/package.html",
    "client/templates/dashboard/packages/grid/package/package.coffee",

    "client/templates/dashboard/packages/grid/grid.html",
    "client/templates/dashboard/packages/grid/grid.coffee",

    "client/templates/dashboard/dashboard.html",
    "client/templates/dashboard/dashboard.coffee",

    "client/templates/dashboard/settings/settingsGeneral/settingsGeneral.html",
    "client/templates/dashboard/settings/settingsGeneral/settingsGeneral.coffee",

    "client/templates/dashboard/settings/settingsAccount/settingsAccount.html",
    "client/templates/dashboard/settings/settingsAccount/settingsAccount.coffee",

    "client/templates/dashboard/settings/settingsAccount/shopMember/shopMember.html",
    "client/templates/dashboard/settings/settingsAccount/shopMember/shopMember.coffee",

    "client/templates/dashboard/settings/settingsAccount/shopMember/memberForm/memberForm.html",
    "client/templates/dashboard/settings/settingsAccount/shopMember/memberForm/memberForm.coffee",

    "client/templates/products/products.html",
    "client/templates/products/products.coffee",

    "client/templates/products/productList/productList.html",
    "client/templates/products/productList/productList.coffee",

    "client/templates/products/productGrid/productGrid.html",
    "client/templates/products/productGrid/productGrid.coffee",

    "client/templates/products/productDetail/productDetail.html",
    "client/templates/products/productDetail/productDetail.coffee",

    "client/templates/products/productDetail/edit/edit.html",
    "client/templates/products/productDetail/edit/edit.coffee",

    "client/templates/products/productDetail/images/productImageGallery.html",
    "client/templates/products/productDetail/images/productImageGallery.coffee",

    "client/templates/products/productDetail/tags/tags.html",
    "client/templates/products/productDetail/tags/tags.coffee",

    "client/templates/products/productDetail/social/social.html",
    "client/templates/products/productDetail/social/social.coffee",

    "client/templates/products/productDetail/variants/variant.html",
    "client/templates/products/productDetail/variants/variant.coffee",

    "client/templates/products/productDetail/variants/variantList/variantList.html",
    "client/templates/products/productDetail/variants/variantList/variantList.coffee",

    "client/templates/products/productDetail/variants/variantForm/variantForm.html",
    "client/templates/products/productDetail/variants/variantForm/variantForm.coffee",

    "client/templates/products/productDetail/variants/variantForm/childVariant/childVariant.html",
    "client/templates/products/productDetail/variants/variantForm/childVariant/childVariant.coffee",

    "client/templates/products/productDetail/attributes/attributes.html",
    "client/templates/products/productDetail/attributes/attributes.coffee",
  ], ["client"]);

  // Private fixture data
  api.addFiles('private/data/Products.json', 'server', {isAsset: true});
  api.addFiles('private/data/Shops.json', 'server', {isAsset: true});
  api.addFiles('private/data/Tags.json', 'server', {isAsset: true});
  api.addFiles('private/data/roles.json', 'server', {isAsset: true});
  api.addFiles('private/data/users.json', 'server', {isAsset: true});
  api.addFiles('private/data/Orders.json', 'server', {isAsset: true});
  //i18n translations
  api.addFiles('private/data/i18n/ar.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/cn.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/cs.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/de.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/en.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/es.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/fr.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/he.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/it.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/my.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/pl.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/pt.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/ru.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/sl.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/sv.json', 'server', {isAsset: true});
  api.addFiles('private/data/i18n/vi.json', 'server', {isAsset: true});

  // We are now grouping all exported app variables and methods under
  // "ReactionCore". The other exported variables should be moved to
  // somewhere within this scope.
  api.export(["ReactionCore"]);
  api.export("ReactionRegistry","server");

  // legacy Exports (TODO: move to ReactionCore)
  api.export([
    "Alerts",
    "CartWorkflow",
    "OrderWorkflow",
    "OrderWorkflowEvents"
  ], ["client"]);

  api.export([
    "currentProduct",
    "ShopController",
    "Products",
    "Cart",
    "Tags"
  ], ["client", "server"]);
});
