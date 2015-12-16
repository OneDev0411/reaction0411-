Meteor.subscribe("Products");

function uploadHandler(event) {
  let shopId = ReactionCore.getShopId();
  let userId = Meteor.userId();
  let files = event.target.files.files;

  for (let i = 0; i < files.length; i++) {
    let parts = files[i].name.split(".");
    let product;
    if (parts[0]) {
      product = ReactionCore.Collections.Products.findOne({
        "variants.barcode": parts[0]
      }, {
        variants: {
          $elemMatch: {
            barcode: parts[0]
          }
        }
      });
    }
    if (product) {
      let fileObj;
      fileObj = new FS.File(files[i]);
      fileObj.metadata = {
        ownerId: userId,
        productId: product._id,
        variantId: product.variants[0]._id,
        shopId: shopId,
        priority: Number(parts[1]) || 0
      };
      ReactionCore.Collections.Media.insert(fileObj);
    }
  }
}

Template.import.events({
  "submit form#form-import-images": function (event) {
    event.preventDefault();
    uploadHandler(event);
  }
});
