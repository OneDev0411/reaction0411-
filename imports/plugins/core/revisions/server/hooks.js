import _ from "lodash";
import { diff } from "deep-diff";
import { Products, Revisions, Tags, Media } from "/lib/collections";
import { Logger } from "/server/api";
import { RevisionApi } from "../lib/api";
import { isEmpty } from "lodash";

function convertMetadata(modifierObject) {
  const metadata = {};
  for (const prop in modifierObject) {
    if (modifierObject.hasOwnProperty(prop)) {
      if (prop.indexOf("metadata") !== -1) {
        const splitName = _.split(prop, ".")[1];
        metadata[splitName] = modifierObject[prop];
      }
    }
  }
  return metadata;
}

const ProductRevision = {
  getProductPriceRange(productId) {
    const product = Products.findOne(productId);
    if (!product) {
      return "";
    }
    const variants = this.getTopVariants(product._id);

    if (variants.length > 0) {
      const variantPrices = [];
      variants.forEach(variant => {
        if (variant.isVisible === true) {
          const range = this.getVariantPriceRange(variant._id);
          if (typeof range === "string") {
            const firstPrice = parseFloat(range.substr(0, range.indexOf(" ")));
            const lastPrice = parseFloat(range.substr(range.lastIndexOf(" ") + 1));
            variantPrices.push(firstPrice, lastPrice);
          } else {
            variantPrices.push(range);
          }
        } else {
          variantPrices.push(0, 0);
        }
      });
      const priceMin = _.min(variantPrices);
      const priceMax = _.max(variantPrices);
      let priceRange = `${priceMin} - ${priceMax}`;
      // if we don't have a range
      if (priceMin === priceMax) {
        priceRange = priceMin.toString();
      }
      const priceObject = {
        range: priceRange,
        min: priceMin,
        max: priceMax
      };
      return priceObject;
    }
    // if we have no variants subscribed to (client)
    // we'll get the price object previously from the product
    return product.price;
  },

  getVariantPriceRange(variantId) {
    const children = this.getVariants(variantId);
    const visibleChildren = children.filter(child => child.isVisible);

    switch (visibleChildren.length) {
      case 0:
        const topVariant = this.getProduct(variantId);
        // topVariant could be undefined when we removing last top variant
        return topVariant && topVariant.price;
      case 1:
        return visibleChildren[0].price;
      default:
        let priceMin = Number.POSITIVE_INFINITY;
        let priceMax = Number.NEGATIVE_INFINITY;

        visibleChildren.map(child => {
          if (child.price < priceMin) {
            priceMin = child.price;
          }
          if (child.price > priceMax) {
            priceMax = child.price;
          }
        });

        if (priceMin === priceMax) {
          // TODO check impact on i18n/formatPrice from moving return to string
          return priceMin.toString();
        }
        return `${priceMin} - ${priceMax}`;
    }
  },

  findRevision({ documentId }) {
    return Revisions.findOne({
      "documentId": documentId,
      "workflow.status": {
        $nin: [
          "revision/published"
        ]
      }
    });
  },

  getProduct(variantId) {
    const product = Products.findOne(variantId);
    const revision = this.findRevision({
      documentId: variantId
    });

    return revision && revision.documentData || product;
  },

  getTopVariants(id) {
    const variants = [];

    Products.find({
      ancestors: [id],
      type: "variant",
      isDeleted: false
    }).map((product) => {
      const revision = this.findRevision({
        documentId: product._id
      });

      if (revision && revision.documentData.isVisible) {
        variants.push(revision.documentData);
      } else if (!revision && product.isVisible) {
        variants.push(product);
      }
    });

    return variants;
  },

  getVariants(id, type) {
    const variants = [];

    Products.find({
      ancestors: { $in: [id] },
      type: type || "variant",
      isDeleted: false
    }).forEach((product) => {
      const revision = this.findRevision({
        documentId: product._id
      });

      if (revision && revision.documentData.isVisible) {
        variants.push(revision.documentData);
      } else if (!revision && product.isVisible) {
        variants.push(product);
      }
    });
    return variants;
  }
};

Media.files.before.insert((userid, media) => {
  if (RevisionApi.isRevisionControlEnabled() === false) {
    return true;
  }
  if (media.metadata.productId) {
    const revisionMetadata = Object.assign({}, media.metadata);
    revisionMetadata.workflow = "published";
    Revisions.insert({
      documentId: media._id,
      documentData: revisionMetadata,
      documentType: "image",
      parentDocument: media.metadata.productId,
      changeType: "insert",
      workflow: {
        status: "revision/update"
      }
    });
    media.metadata.workflow = "unpublished";
  } else {
    media.metadata.workflow = "published";
  }
  return true;
});

Media.files.before.update((userId, media, fieldNames, modifier) => {
  if (RevisionApi.isRevisionControlEnabled() === false) {
    return true;
  }
  // if it's not metadata ignore it, as LOTS of othing things change on this record
  if (!_.includes(fieldNames, "metadata")) {
    return true;
  }

  if (media.metadata.productId) {
    const convertedModifier = convertMetadata(modifier.$set);
    const convertedMetadata = Object.assign({}, media.metadata, convertedModifier);
    const existingRevision = Revisions.findOne({
      "documentId": media._id,
      "workflow.status": {
        $nin: [
          "revision/published"
        ]
      }
    });
    if (existingRevision) {
      const updatedMetadata = Object.assign({}, existingRevision.documentData, convertedMetadata);
      // Special case where if we have both added and reordered images before publishing we don't want to overwrite
      // the workflow status since it would be "unpublished"
      if (existingRevision.documentData.workflow === "published" || existingRevision.changeType === "insert") {
        updatedMetadata.workflow = "published";
      }
      Revisions.update({ _id: existingRevision._id }, {
        $set: {
          documentData: updatedMetadata
        }
      });
    } else {
      Revisions.insert({
        documentId: media._id,
        documentData: convertedMetadata,
        documentType: "image",
        parentDocument: media.metadata.productId,
        changeType: "update",
        workflow: {
          status: "revision/update"
        }
      });
    }

    return false; // prevent actual update of image. This also stops other hooks from running :/
  }
  // for non-product images, just ignore and keep on moving
  return true;
});

Media.files.before.remove((userId, media) => {
  if (RevisionApi.isRevisionControlEnabled() === false) {
    return true;
  }

  // if the media is unpublished, then go ahead and just delete it
  if (media.metadata.workflow && media.metadata.workflow === "unpublished") {
    Revisions.remove({
      documentId: media._id
    });
    return true;
  }
  if (media.metadata.productId) {
    Revisions.insert({
      documentId: media._id,
      documentData: media.metadata,
      documentType: "image",
      parentDocument: media.metadata.productId,
      changeType: "remove",
      workflow: {
        status: "revision/update"
      }
    });
    return false; // prevent actual deletion of image. This also stops other hooks from running :/
  }
  return true;
});


Products.before.insert((userId, product) => {
  if (RevisionApi.isRevisionControlEnabled() === false) {
    return true;
  }

  const productRevision = Revisions.findOne({
    "documentId": product._id,
    "workflow.status": {
      $nin: [
        "revision/published"
      ]
    }
  });

  // Prevent this product beign created if a parent product / varaint ancestor is deleted.
  //
  // This will prevent cases where a parent variant hase been deleted and a user tries to create a
  // child variant. You cannot create the child variant becuase the parent will no longer exist when
  // changes have been published; resulting in a broken inheretence and UI
  const productHasAncestors = Array.isArray(product.ancestors);

  if (productHasAncestors) {
    // Verify there are no deleted ancestors,
    // Variants cannot be restored if their parent product / variant is deleted
    const archivedCount = Revisions.find({
      "documentId": { $in: product.ancestors },
      "documentData.isDeleted": true,
      "workflow.status": {
        $nin: [
          "revision/published"
        ]
      }
    }).count();

    if (archivedCount > 0) {
      Logger.debug(`Cannot create product ${product._id} as a product/variant higher in it's ancestors tree is marked as 'isDeleted'.`);
      throw new Meteor.Error(403, "Unable to create product variant");
    }
  }


  if (!productRevision) {
    Logger.debug(`No revision found for product ${product._id}. Creating new revision`);

    Revisions.insert({
      documentId: product._id,
      documentData: product
    });
  }
});


Products.before.update(function (userId, product, fieldNames, modifier, options) {
  if (RevisionApi.isRevisionControlEnabled() === false) {
    return true;
  }

  let productRevision = Revisions.findOne({
    "documentId": product._id,
    "workflow.status": {
      $nin: [
        "revision/published"
      ]
    }
  });

  // Prevent this product revision from beign restored from isDeleted state if a product / varaint
  // ancestor is also deleted.
  //
  // This will prevent cases where a parent variant hase been deleted and a user tries to undeleted a
  // child variant. You cannot undeleted the child variant, becuase the parent will no longer exist when
  // changes have been published; resulting in a broken inheretence and UI
  const revisionHasAncestors = productRevision && productRevision.documentData && Array.isArray(productRevision.documentData.ancestors);
  const modiferContainsIsDeleted = modifier.$set && modifier.$set.isDeleted === false;

  if (revisionHasAncestors && modiferContainsIsDeleted) {
    // Verify there are no deleted ancestors,
    // Variants cannot be restored if their parent product / variant is deleted
    const archivedCount = Revisions.find({
      "documentId": { $in: productRevision.documentData.ancestors },
      "documentData.isDeleted": true,
      "workflow.status": {
        $nin: [
          "revision/published"
        ]
      }
    }).count();

    if (archivedCount > 0) {
      Logger.debug(`Cannot restore product ${product._id} as a product/variant higher in it's ancestors tree is marked as 'isDeleted'.`);
      throw new Meteor.Error(403, "Unable to delete product variant");
    }
  }

  const originalSelector = this.args[0];

  if (!productRevision) {
    Logger.debug(`No revision found for product ${product._id}. Creating new revision`);

    // Create a new revision
    Revisions.insert({
      documentId: product._id,
      documentData: product
    });

    // Fetch newly created revision
    productRevision = Revisions.findOne({
      documentId: product._id
    });
  }

  // Create a new selector for the revision
  //
  // This is especially important since we may need to update some fields
  // like metadata, and the selector is very important to that.
  const revisionSelector = {
    "documentId": product._id,
    "workflow.status": {
      $nin: [
        "revision/published"
      ]
    }
  };

  // Create a new modifier for the revision
  const revisionModifier = {
    $set: {
      "workflow.status": "revision/update"
    }
  };

  if (options.publish === true || (product.workflow && product.workflow.status === "product/publish")) {
    // Maybe mark the revision as published

    Logger.debug(`Publishing revison for product ${product._id}.`);
    Revisions.update(revisionSelector, {
      $set: {
        "workflow.status": "revision/published"
      }
    });

    return true;
  }

  for (const operation in modifier) {
    if (Object.hasOwnProperty.call(modifier, operation)) {
      if (!revisionModifier[operation]) {
        revisionModifier[operation] = {};
      }

      for (const property in modifier[operation]) {
        if (modifier[operation].hasOwnProperty(property)) {
          if (operation === "$set" && property === "metafields.$") {
            // Special handling for meta fields with $ operator
            // We need to update the selector otherwise the operation would completly fail.
            //
            // This does NOT apply to metafield.0, metafield.1, metafield.n operations
            // where 0, 1, n represent an array index.
            revisionSelector["documentData.metafields"] = originalSelector.metafields;
            revisionModifier.$set[`documentData.${property}`] = modifier.$set[property];
          } else if (operation === "$push" && property === "hashtags") {
            if (!revisionModifier.$addToSet) {
              revisionModifier.$addToSet = {};
            }
            revisionModifier.$addToSet[`documentData.${property}`] = modifier.$push[property];
          } else if (operation === "$set" && property === "price" && Array.isArray(product.ancestors) && product.ancestors.length) {
            Revisions.update(revisionSelector, {
              $set: {
                "documentData.price": modifier.$set.price
              }
            });

            const updateId = product.ancestors[0] || product._id;
            const priceRange = ProductRevision.getProductPriceRange(updateId);

            Meteor.call("products/updateProductField", updateId, "price", priceRange);
          } else if (operation === "$set" && property === "isVisible" && Array.isArray(product.ancestors) && product.ancestors.length) {
            Revisions.update(revisionSelector, {
              $set: {
                "documentData.isVisible": modifier.$set.isVisible
              }
            });

            const updateId = product.ancestors[0] || product._id;
            const priceRange = ProductRevision.getProductPriceRange(updateId);

            Meteor.call("products/updateProductField", updateId, "price", priceRange);
          } else {
            // Let everything else through
            revisionModifier[operation][`documentData.${property}`] = modifier[operation][property];
          }
        }
      }
    }
  }

  Revisions.update(revisionSelector, revisionModifier);

  Logger.debug(`Revison updated for product ${product._id}.`);

  if (modifier.$pull && modifier.$pull.hashtags) {
    const tagId = modifier.$pull.hashtags;

    const productCount = Products.find({
      hashtags: {
        $in: [tagId]
      }
    }).count();

    const relatedTagsCount = Tags.find({
      relatedTagIds: {
        $in: [tagId]
      }
    }).count();

    if (productCount === 0 && relatedTagsCount === 0) {
      // Mark tag as deleted
      Tags.update({
        _id: tagId
      }, {
        $set: {
          isDeleted: true
        }
      });
    } else {
      Tags.update({
        _id: tagId
      }, {
        $set: {
          isDeleted: false
        }
      });
    }
  }

  // Allow the product collection to be updated if
  if ((modifier.$set || modifier.$inc) && !modifier.$pull && !modifier.$push) {
    const newSet = {};
    const newInc = {};
    const ignoredFields = [
      "isLowQuantity",
      "isSoldOut",
      "inventoryQuantity"
    ];

    for (const field of ignoredFields) {
      if (modifier.$set && modifier.$set[field]) {
        newSet[field] = modifier.$set[field];
      }

      if (modifier.$inc && modifier.$inc[field]) {
        newInc[field] = modifier.$inc[field];
      }
    }

    modifier.$set = newSet;
    modifier.$inc = newInc;

    // if (isEmpty(newSet) === false) {
    //   Products.update(originalSelector, modifier, {
    //     publish: true,
    //     selector: options.selector
    //   });
    // }
  }

  // prevent the underlying document from being modified as it is in draft mode
  return false;
});

Products.before.remove(function (userId, product) {
  if (RevisionApi.isRevisionControlEnabled() === false) {
    return true;
  }

  let productRevision = Revisions.findOne({
    documentId: product._id
  });

  if (!productRevision) {
    Logger.debug(`No revision found for product ${product._id}. Creating new revision`);

    Revisions.insert({
      documentId: product._id,
      documentData: product
    });
    productRevision =  Revisions.findOne({
      documentId: product._id
    });
  }

  // Set the revision as deleted "isDeleted: true"
  Revisions.update({
    documentId: product._id
  }, {
    $set: {
      "documentData.isDeleted": true,
      "workflow.status": "revision/remove"
    }
  });

  Logger.debug(`Revison updated for product ${product._id}.`);
  Logger.debug(`Product ${product._id} is now marked as deleted.`);

  // If the original product is deleted, and the user is trying to delete it again,
  // then actually remove it completly.
  //
  // This acts like a trash. Where the product is sent to trash before it can actually
  // be deleted perminately.
  if (product.isDeleted === true) {
    Logger.debug(`Allowing write to product ${product._id} for Collection.remove().`);

    return true;
  }

  Logger.debug(`Preventing write to product ${product._id} for Collection.remove().`);

  return false;
});

Revisions.after.update(function (userId, revision) {
  if (RevisionApi.isRevisionControlEnabled() === false) {
    return true;
  }
  let differences;


  if (!revision.documentType || revision.documentType === "product") {
    // Make diff
    const product = Products.findOne({
      _id: revision.documentId
    });
    differences = diff(product, revision.documentData);
  }

  if (revision.documentType && revision.documentType === "image") {
    const image = Media.findOne(revision.documentId);
    differences = diff(image.metadata, revision.documentData);
  }

  Revisions.direct.update({
    _id: revision._id
  }, {
    $set: {
      diff: differences && differences.map((d) => Object.assign({}, d))
    }
  });
}, {
  fetchPrevious: false
});
