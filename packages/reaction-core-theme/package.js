Package.describe({
  name: "reactioncommerce:core-theme",
  summary: "Reaction Commerce core theme",
  version: "2.0.1",
  documentation: "README.md"
});

Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.2");

  api.use("less");

  api.addFiles("theme-data.js", "server");
  api.export(["ThemeData"]);

  api.addFiles("lib/bootstrap/dist/js/bootstrap.js", ["client"]);

  // reaction logo
  api.addAssets([
    "fonts/fontello.eot", // IE8 or older only understands EOT. IE9+ will read it too
    "fonts/fontello.svg", // SVG fallback for iOS < 5 - http://caniuse.com/#feat=svg-fonts
    "fonts/fontello.ttf",  // Android Browers 4.1, 4.3 - http://caniuse.com/#feat=ttf
    "fonts/fontello.woff", // Most modern browsers
    "fonts/fontello.woff2" // Chrome 36+, Opera 23+; improves compression
  ], ["client"]);
  api.addFiles("theme/dashboard/icon.css", "client")

  // bootstrap + custom reaction less
  api.addFiles([
    "default/base.less",
    "default/alerts.less",
    "default/bootstrap.rtl.less",
    "default/dropdowns.less",
    "default/forms.less",
    "default/grid.less",
    "default/mixins/lesshat.less",
    "default/mixins/rtl.less",
    "default/mixins/flexbox.less",
    "default/mixins/ribbon.less",
    "default/mixins.less",
    "default/navs.less",
    "default/panels.less",
    "default/popovers.less",
    "default/variables.less",
    "lib/bootstrap/less/alerts.less",
    "lib/bootstrap/less/badges.less",
    "lib/bootstrap/less/bootstrap.less",
    "lib/bootstrap/less/breadcrumbs.less",
    "lib/bootstrap/less/button-groups.less",
    "lib/bootstrap/less/buttons.less",
    "lib/bootstrap/less/carousel.less",
    "lib/bootstrap/less/close.less",
    "lib/bootstrap/less/code.less",
    "lib/bootstrap/less/component-animations.less",
    "lib/bootstrap/less/dropdowns.less",
    "lib/bootstrap/less/forms.less",
    "lib/bootstrap/less/glyphicons.less",
    "lib/bootstrap/less/grid.less",
    "lib/bootstrap/less/input-groups.less",
    "lib/bootstrap/less/jumbotron.less",
    "lib/bootstrap/less/labels.less",
    "lib/bootstrap/less/list-group.less",
    "lib/bootstrap/less/media.less",
    "lib/bootstrap/less/mixins/alerts.less",
    "lib/bootstrap/less/mixins/background-variant.less",
    "lib/bootstrap/less/mixins/border-radius.less",
    "lib/bootstrap/less/mixins/buttons.less",
    "lib/bootstrap/less/mixins/center-block.less",
    "lib/bootstrap/less/mixins/clearfix.less",
    "lib/bootstrap/less/mixins/forms.less",
    "lib/bootstrap/less/mixins/gradients.less",
    "lib/bootstrap/less/mixins/grid-framework.less",
    "lib/bootstrap/less/mixins/grid.less",
    "lib/bootstrap/less/mixins/hide-text.less",
    "lib/bootstrap/less/mixins/image.less",
    "lib/bootstrap/less/mixins/labels.less",
    "lib/bootstrap/less/mixins/list-group.less",
    "lib/bootstrap/less/mixins/nav-divider.less",
    "lib/bootstrap/less/mixins/nav-vertical-align.less",
    "lib/bootstrap/less/mixins/opacity.less",
    "lib/bootstrap/less/mixins/pagination.less",
    "lib/bootstrap/less/mixins/panels.less",
    "lib/bootstrap/less/mixins/progress-bar.less",
    "lib/bootstrap/less/mixins/reset-filter.less",
    "lib/bootstrap/less/mixins/reset-text.less",
    "lib/bootstrap/less/mixins/resize.less",
    "lib/bootstrap/less/mixins/responsive-visibility.less",
    "lib/bootstrap/less/mixins/size.less",
    "lib/bootstrap/less/mixins/tab-focus.less",
    "lib/bootstrap/less/mixins/table-row.less",
    "lib/bootstrap/less/mixins/text-emphasis.less",
    "lib/bootstrap/less/mixins/text-overflow.less",
    "lib/bootstrap/less/mixins/vendor-prefixes.less",
    "lib/bootstrap/less/mixins.less",
    "lib/bootstrap/less/modals.less",
    "lib/bootstrap/less/navbar.less",
    "lib/bootstrap/less/navs.less",
    "lib/bootstrap/less/normalize.less",
    "lib/bootstrap/less/pager.less",
    "lib/bootstrap/less/pagination.less",
    "lib/bootstrap/less/panels.less",
    "lib/bootstrap/less/popovers.less",
    "lib/bootstrap/less/print.less",
    "lib/bootstrap/less/progress-bars.less",
    "lib/bootstrap/less/responsive-embed.less",
    "lib/bootstrap/less/responsive-utilities.less",
    "lib/bootstrap/less/scaffolding.less",
    "lib/bootstrap/less/tables.less",
    "lib/bootstrap/less/theme.less",
    "lib/bootstrap/less/thumbnails.less",
    "lib/bootstrap/less/tooltip.less",
    "lib/bootstrap/less/type.less",
    "lib/bootstrap/less/utilities.less",
    "lib/bootstrap/less/variables.less",
    "lib/bootstrap/less/wells.less",
    "theme/accounts/accounts.less",
    "theme/accounts/inline/inline.less",
    "theme/cart/cartDrawer/cartDrawer.less",
    "theme/cart/cartDrawer/cartItems/cartItems.less",
    "theme/cart/cartDrawer/cartSubTotals/cartSubTotals.less",
    "theme/cart/cartIcon/cartIcon.less",
    "theme/cart/checkout/addressBook/addressBook.less",
    "theme/cart/checkout/checkout.less",
    "theme/cart/checkout/progressBar/progressBar.less",
    "theme/dashboard/console/console.less",
    "theme/dashboard/dashboard.less",
    "theme/dashboard/orders/orders.less",
    "theme/dashboard/packages/grid/package/package.less",
    "theme/dashboard/shop/accounts.less",
    "theme/dashboard/shop/settings.less",
    "theme/dashboard/widget/widget.less",
    "theme/layout/footer/footer.less",
    "theme/layout/header/header.less",
    "theme/layout/header/tags/tags.less",
    "theme/layout/layout.less",
    "theme/products/productDetail/attributes/attributes.less",
    "theme/products/productDetail/images/productImageGallery.less",
    "theme/products/productDetail/productDetail.less",
    "theme/products/productDetail/tags/tags.less",
    "theme/products/productDetail/variants/variant.less",
    "theme/products/productDetail/variants/variantForm/childVariant/childVariant.less",
    "theme/products/productDetail/variants/variantForm/variantForm.less",
    "theme/products/productDetail/variants/variantList/variantList.less",
    "theme/products/productGrid/productGrid.less",
    "theme/products/productList/productList.less",
    "theme/products/products.less"
  ], "client", {isImport: true});
});
