/**
* productSocial helpers
*/

Template.productSocial.helpers({
  customSocialSettings: function () {
    let product = selectedProduct();
    let current = selectedVariant();
    let settings = {
      placement: "productDetail",
      faClass: "",
      faSize: "fa-lg",
      media: Session.get("variantImgSrc"),
      url: window.location.href,
      title: current.title,
      description: product.description !== null ? product.description.substring(0, 254) : void 0,
      apps: {
        facebook: {
          description: product.facebookMsg
        },
        twitter: {
          title: product.twitterMsg
        },
        googleplus: {
          itemtype: "Product",
          description: product.googleplusMsg
        },
        pinterest: {
          description: product.pinterestMsg
        }
      }
    };
    return settings;
  }
});
