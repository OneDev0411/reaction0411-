Package.describe({
  summary: "Reaction Shop - commerce package for Reaction platform"
});

Npm.depends({
    "node-geocoder": "0.6.0",
    "phantomjs": '1.9.7-1',
    "node-phantom": '0.2.5'
});


Package.on_use(function (api, where) {
  api.use([
    "standard-app-packages",
    "coffeescript",
    "underscore",
    "underscore-string-latest",
    "simple-schema",
    "collection-hooks",
    "collection2",
    "roles",
    "less",
    "amplify",
    "accounts-base",
    "collectionFS"
  ], ["client", "server"]);

  api.use([
    "autoform",
    "iron-router",
    "jqueryui",
    "jquery-cookie",
    "videojs",
    "moment",
    "spin"
  ], ["client"]);

api.add_files([
    //bootstrap
    "lib/bootstrap/lib/js/transition.js",
    "lib/bootstrap/lib/js/alert.js",
    "lib/bootstrap/lib/js/button.js",
    "lib/bootstrap/lib/js/carousel.js",
    "lib/bootstrap/lib/js/collapse.js",
    "lib/bootstrap/lib/js/dropdown.js",
    "lib/bootstrap/lib/js/modal.js",
    "lib/bootstrap/lib/js/tooltip.js",
    "lib/bootstrap/lib/js/popover.js",
    "lib/bootstrap/lib/js/scrollspy.js",
    "lib/bootstrap/lib/js/tab.js",
    "lib/bootstrap/lib/js/affix.js",

    // x-editable
    "lib/bootstrap3-editable-1.5.1/bootstrap3-editable/css/bootstrap-editable.css",
    "lib/bootstrap3-editable-1.5.1/bootstrap3-editable/js/bootstrap-editable.js",
    "lib/bootstrap3-editable-1.5.1/bootstrap3-editable/img/clear.png",
    "lib/bootstrap3-editable-1.5.1/bootstrap3-editable/img/loading.gif"
 ], ["client"]);

  // Core Reaction
  api.add_files([
    "lib/header_spy.coffee",
    "lib/statemachine/state-machine.js",
    "common/collections.coffee",
    "common/hooks.coffee"
  ], ["client", "server"]);

  api.add_files([
    "server/app.coffee",
    "server/publications.coffee",
    "server/methods/methods.coffee",
    "server/methods/cart/methods.coffee",
    "server/methods/orders/methods.coffee",
    "server/methods/products/methods.coffee",
    "server/methods/accounts/accounts.coffee",
    "server/installHeaderSpy.coffee",
    "server/emailTemplates/shopMemberInvite.handlebars",
    "server/emailTemplates/shopMemberNotification.handlebars"
  ], ["server"]);

  api.add_files([
    "lib/masonry/masonry.pkgd.js",
    "lib/sparkline/jquery.sparkline.js",

    "lib/select2/select2.js",
    "lib/select2/select2.css",
    "lib/select2-bootstrap-css/select2-bootstrap.css",

    "lib/owl.carousel/owl-carousel/owl.carousel.css",
    "lib/owl.carousel/owl-carousel/owl.theme.css",
    "lib/owl.carousel/owl-carousel/owl.carousel.js",
    "lib/imagesLoaded/imagesloaded.pkgd.js",

    "lib/jquery-ui-1.10.3.custom.css",
    "lib/jquery.collapsible.js",
    "lib/jquery.serialize-hash.coffee",

    "client/app.coffee",
    "client/register.coffee",
    "client/subscriptions.coffee",
    "client/routing.coffee",

    "client/helpers/helpers.coffee",
    "client/helpers/config.coffee",
    "client/helpers/handlebars.coffee",

    "client/workflows/cart/workflow.coffee",
    "client/workflows/orders/workflow.coffee",

    "client/templates/layout/header/header.html",
    "client/templates/layout/header/header.coffee",

    "client/templates/layout/header/tags/tags.html",
    "client/templates/layout/header/tags/tags.coffee",

    "client/templates/layout/footer/footer.html",
    "client/templates/layout/footer/footer.coffee",

    "client/templates/layout/loading/loading.html",

    "client/templates/layout/shopHeader/shopNavElements/shopNavElements.html",
    "client/templates/layout/shopHeader/shopNavElements/shopNavElements.coffee",

    "client/templates/layout/notice/unauthorized.html",
    "client/templates/layout/notice/shopNotFound.html",

    "client/templates/layout/errors/errors.html",
    "client/templates/layout/errors/errors.coffee",

    "client/templates/cart/cartDrawer/cartDrawer.html",
    "client/templates/cart/cartDrawer/cartDrawer.coffee",

    "client/templates/cart/cartDrawer/cartItems/cartItems.html",
    "client/templates/cart/cartDrawer/cartItems/cartItems.coffee",

    "client/templates/cart/cartDrawer/cartSubTotals/cartSubTotals.html",
    "client/templates/cart/cartDrawer/cartSubTotals/cartSubTotals.coffee",

    "client/templates/cart/cartIcon/cartIcon.html",
    "client/templates/cart/cartIcon/cartIcon.coffee",

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

    "client/templates/cart/checkout/addressBook/addressForm/add.html",
    "client/templates/cart/checkout/addressBook/addressForm/add.coffee",

    "client/templates/cart/checkout/addressBook/addressForm/edit.html",
    "client/templates/cart/checkout/addressBook/addressForm/edit.coffee",

    "client/templates/cart/checkout/review/review.html",
    "client/templates/cart/checkout/review/review.coffee",

    "client/templates/cart/checkout/payment/payment.html",
    "client/templates/cart/checkout/payment/payment.coffee",

    "client/templates/cart/checkout/payment/methods/cards.html",
    "client/templates/cart/checkout/payment/methods/cards.coffee",

    "client/templates/cart/checkout/completed/completed.html",
    "client/templates/cart/checkout/completed/completed.coffee",

    "client/templates/cart/checkout/shipping/shipping.html",
    "client/templates/cart/checkout/shipping/shipping.coffee",

    "client/templates/dashboard/widget/widget.html",
    "client/templates/dashboard/widget/widget.coffee",

    "client/templates/dashboard/shopwelcome/shopwelcome.html",

    "client/templates/dashboard/header/links.html",
    "client/templates/dashboard/header/links.coffee",

    "client/templates/dashboard/customers/customers.html",
    "client/templates/dashboard/customers/customers.coffee",

    "client/templates/dashboard/orders/orders.html",
    "client/templates/dashboard/orders/orders.coffee",

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

    "client/templates/dashboard/navigation/dashboardSidebar.html",
    "client/templates/dashboard/navigation/dashboardSidebar.coffee",

    "client/templates/dashboard/packages/activePkgGrid/widget/widget.html",
    "client/templates/dashboard/packages/activePkgGrid/widget/widget.coffee",

    "client/templates/dashboard/packages/activePkgGrid/activePkgGrid.html",
    "client/templates/dashboard/packages/activePkgGrid/activePkgGrid.coffee",

    "client/templates/dashboard/packages/availablePkgGrid/pkg/pkg.html",
    "client/templates/dashboard/packages/availablePkgGrid/pkg/pkg.coffee",

    "client/templates/dashboard/packages/availablePkgGrid/availablePkgGrid.html",
    "client/templates/dashboard/packages/availablePkgGrid/availablePkgGrid.coffee",

    "client/templates/dashboard/packages/dashboard.html",
    "client/templates/dashboard/packages/dashboard.coffee",

    "client/templates/dashboard/introduction/introduction.html",
    "client/templates/dashboard/introduction/introduction.coffee",

    "client/templates/settings/settingsGeneral/settingsGeneral.html",
    "client/templates/settings/settingsGeneral/settingsGeneral.coffee",

    "client/templates/settings/settingsAccount/settingsAccount.html",
    "client/templates/settings/settingsAccount/settingsAccount.coffee",

    "client/templates/settings/settingsAccount/shopMember/shopMember.html",
    "client/templates/settings/settingsAccount/shopMember/shopMember.coffee",

    "client/templates/settings/settingsAccount/shopMember/memberForm/memberForm.html",
    "client/templates/settings/settingsAccount/shopMember/memberForm/memberForm.coffee",

    "client/templates/products/products.html",
    "client/templates/products/productList/productList.html",
    "client/templates/products/productList/productList.coffee",

    "client/templates/products/productGrid/productGrid.html",
    "client/templates/products/productGrid/productGrid.coffee",

    "client/templates/products/productDetail/productDetail.html",
    "client/templates/products/productDetail/productDetail.coffee",

    "client/templates/products/productDetail/images/productImageGallery.html",
    "client/templates/products/productDetail/images/productImageGallery.coffee",

    "client/templates/products/productDetail/social/social.html",
    "client/templates/products/productDetail/social/social.coffee",

    "client/templates/products/productDetail/variants/variant.html",
    "client/templates/products/productDetail/variants/variant.coffee",

    "client/templates/products/productDetail/variants/variantForm/variantForm.html",
    "client/templates/products/productDetail/variants/variantForm/variantForm.coffee",

    "client/templates/products/productDetail/attributes/attributes.html",
    "client/templates/products/productDetail/attributes/attributes.coffee",

    // LESS IMPORT FILES
    // All less is imported in themes/import.less, only add here for dev hot reload
    "client/themes/imports.less",
    "client/themes/default/theme.import.less",
    "client/themes/default/variables.import.less",
    "client/themes/default/mixin.import.less",

    // Monitor these LESS import files for changes
    "client/templates/cart/cartDrawer/cartDrawer.import.less",
    "client/templates/cart/cartDrawer/cartItems/cartItems.import.less",
    "client/templates/cart/cartDrawer/cartSubTotals/cartSubTotals.import.less",
    "client/templates/cart/cartIcon/cartIcon.import.less",
    "client/templates/cart/checkout/addressBook/addressBook.import.less",
    "client/templates/cart/checkout/checkout.import.less",
    "client/templates/cart/checkout/completed/completed.import.less",
    "client/templates/cart/checkout/header/header.import.less",
    "client/templates/cart/checkout/login/login.import.less",
    "client/templates/cart/checkout/payment/methods/cards.import.less",
    "client/templates/cart/checkout/payment/payment.import.less",
    "client/templates/cart/checkout/progressBar/progressBar.import.less",
    "client/templates/cart/checkout/review/review.import.less",
    "client/templates/cart/checkout/shipping/shipping.import.less",
    "client/templates/dashboard/navigation/dashboardSidebar.import.less",
    "client/templates/dashboard/orders/details/detail.import.less",
    "client/templates/dashboard/orders/orders.import.less",
    "client/templates/dashboard/orders/social/orderSocial.import.less",
    "client/templates/dashboard/orders/stateHelpers/completed/completed.import.less",
    "client/templates/dashboard/orders/stateHelpers/documents/documents.import.less",
    "client/templates/dashboard/orders/stateHelpers/packing/packing.import.less",
    "client/templates/dashboard/orders/stateHelpers/payment/payment.import.less",
    "client/templates/dashboard/orders/stateHelpers/shipped/shipped.import.less",
    "client/templates/dashboard/orders/stateHelpers/tracking/tracking.import.less",
    "client/templates/dashboard/packages/activePkgGrid/activePkgGrid.import.less",
    "client/templates/dashboard/packages/activePkgGrid/widget/widget.import.less",
    "client/templates/dashboard/packages/availablePkgGrid/availablePkgGrid.import.less",
    "client/templates/dashboard/packages/availablePkgGrid/pkg/pkg.import.less",
    "client/templates/dashboard/packages/dashboard.import.less",
    "client/templates/dashboard/widget/widget.import.less",
    "client/templates/layout/header/header.import.less",
    "client/templates/layout/footer/footer.import.less",
    "client/templates/layout/header/tags/tags.import.less",
    "client/templates/products/productDetail/attributes/attributes.import.less",
    "client/templates/products/productDetail/images/productImageGallery.import.less",
    "client/templates/products/productDetail/productDetail.import.less",
    "client/templates/products/productDetail/social/social.import.less",
    "client/templates/products/productDetail/variants/variant.import.less",
    "client/templates/products/productDetail/variants/variantForm/variantForm.import.less",
    "client/templates/products/productGrid/productGrid.import.less",
    "client/templates/products/productList/productList.import.less",
    "client/templates/products/products.import.less",
    "client/templates/settings/settingsAccount/shopMember/shopMember.import.less",
    "client/templates/settings/settingsGeneral/settingsGeneral.import.less"

  ], ["client"]);

  api.export([
    "PackagesHandle",
    "CartWorkflow",
    "OrderWorkflow",
    "OrderWorkflowEvents"
  ], ["client"]);

  api.export([
    "Packages",
    "PackageConfigSchema",
    "currentProduct",
    "install_spy",
    "ShopController",
    "Products",
    "ShopMemberSchema",
    "ProductVariantSchema",
    "AddressSchema",
    "VariantMediaSchema",
    "MetafieldSchema",
    "CartItemSchema",
    "Shop",
    "Cart",
    "Tags"
  ], ["client", "server"]);
});
