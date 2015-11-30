Package.describe({
  name: "reactioncommerce:core-theme",
  summary: "Reaction Commerce core theme",
  version: "1.8.0",
  git: "https://github.com/reactioncommerce/core-theme.git"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.2');

  api.addFiles('theme-data.js', 'server');
  api.export(['ThemeData']);

  // Everything after this point is generated by the build-package.sh
  // AUTOGENERATED
  api.addAssets([
    'default/bootstrap.rtl.less',
    'default/navs.less',
    'default/grid.less',
    'default/mixins.less',
    'default/popovers.less',
    'default/variables.less',
    'default/panels.less',
    'default/dropdowns.less',
    'default/alerts.less',
    'default/forms.less',
    'default/mixins/lesshat.less',
    'theme/accounts/accounts.less',
    'theme/accounts/inline/inline.less',
    'theme/cart/cartDrawer/cartDrawer.less',
    'theme/cart/cartDrawer/cartItems/cartItems.less',
    'theme/cart/cartDrawer/cartSubTotals/cartSubTotals.less',
    'theme/cart/cartIcon/cartIcon.less',
    'theme/cart/checkout/addressBook/addressBook.less',
    'theme/cart/checkout/checkout.less',
    'theme/cart/checkout/progressBar/progressBar.less',
    'theme/dashboard/console/console.less',
    'theme/dashboard/dashboard.less',
    'theme/dashboard/orders/orders.less',
    'theme/dashboard/packages/grid/package/package.less',
    'theme/dashboard/shop/accounts.less',
    'theme/dashboard/shop/settings.less',
    'theme/dashboard/widget/widget.less',
    'theme/layout/footer/footer.less',
    'theme/layout/header/header.less',
    'theme/layout/header/tags/tags.less',
    'theme/layout/layout.less',
    'theme/products/productDetail/attributes/attributes.less',
    'theme/products/productDetail/images/productImageGallery.less',
    'theme/products/productDetail/productDetail.less',
    'theme/products/productDetail/tags/tags.less',
    'theme/products/productDetail/variants/variant.less',
    'theme/products/productDetail/variants/variantForm/childVariant/childVariant.less',
    'theme/products/productDetail/variants/variantForm/variantForm.less',
    'theme/products/productDetail/variants/variantList/variantList.less',
    'theme/products/productGrid/productGrid.less',
    'theme/products/productList/productList.less',
    'theme/products/products.less',
  ], 'server');
});
