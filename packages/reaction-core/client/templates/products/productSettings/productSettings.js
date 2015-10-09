let weightDependency = new Tracker.Dependency;

Template.productSettings.helpers({
  displayPrice: function () {
    if (this._id) {
      return getProductPriceRange(this._id);
    }
  },

  media: function () {
    let defaultImage;
    const variants = [];
    for (let variant of this.variants) {
      if (!variant.parentId) {
        variants.push(variant);
      }
    }

    if (variants.length > 0) {
      let variantId = variants[0]._id;
      defaultImage = ReactionCore.Collections.Media.findOne({
        "metadata.variantId": variantId,
        "metadata.priority": 0
      });
    }
    if (defaultImage) {
      return defaultImage;
    }
    return false;
  },
  additionalMedia: function () {
    let mediaArray;
    const variants = [];
    for (let variant of this.variants) {
      if (!variant.parentId) {
        variants.push(variant);
      }
    }

    if (variants.length > 0) {
      let variantId = variants[0]._id;
      mediaArray = ReactionCore.Collections.Media.find({
        "metadata.variantId": variantId,
        "metadata.priority": {
          $gt: 0
        }
      }, {
        limit: 3
      });
    }
    if (mediaArray.count() > 1) {
      return mediaArray;
    }
    return false;
  },
  weightClass: function () {
    weightDependency.depend();
    let position = this.position || {};
    let weight = position.weight || 0;
    switch (weight) {
    case 1:
      return "product-medium";
    case 2:
      return "product-large";
    default:
      return "product-small";
    }
  },

  itemWeightActive: function (weight) {
    weightDependency.depend();

    let position = this.position || {};
    let currentWeight = position.weight || 0;
    if (currentWeight === weight) {
      return "active";
    }

    return "";
  },

  isMediumWeight: function () {
    weightDependency.depend();

    let position = this.position || {};
    let weight = position.weight || 0;
    if (weight === 1) {
      return true;
    }
    return false;
  },
  isLargeWeight: function () {
    weightDependency.depend();

    let position = this.position || {};
    let weight = position.weight || 0;
    if (weight === 3) {
      return true;
    }
    return false;
  },
  shouldShowAdditionalImages: function () {
    weightDependency.depend();

    if (this.isMediumWeight && this.mediaArray) {
      return true;
    }
    return false;
  }
});

/**
 * productExtendedControls events
 */

Template.productSettings.events({
  "click [data-event-action=deleteProduct]": function () {
    maybeDeleteProduct(this);
  },
  "click [data-event-action=cloneProduct]": function () {
    let title;
    title = this.title;
    return Meteor.call("products/cloneProduct", this, function (error,
      productId) {
      if (error) {
        throw new Meteor.Error("error cloning product", error);
      }
      Router.go("product", {
        _id: productId
      });
      return Alerts.add("Cloned " + title, "success", {
        placement: "productManagement",
        id: productId,
        i18nKey: "productDetail.cloneMsg",
        autoHide: true,
        dismissable: false
      });
    });
  },

  "click [data-event-action=changeProductWeight]": function (event) {
    event.preventDefault();
    let weight = $(event.currentTarget).data("event-data") || 0;
    let position = {
      tag: ReactionCore.getCurrentTag(),
      weight: weight,
      updatedAt: new Date()
    };

    this.position = position;

    Meteor.call("products/updateProductPosition", this._id, position,
      function () {
        weightDependency.changed();
      });
  },

  "click [data-event-action=publishProduct]": function () {
    let self;
    self = this;
    return Meteor.call("products/publishProduct", this._id, function (
      error, result) {
      if (error) {
        Alerts.add(error, "danger", {
          placement: "productGridItem",
          id: self._id
        });
        return {};
      }
      if (result === true) {
        return Alerts.add(self.title + " is now visible", "success", {
          placement: "productGridItem",
          type: self._id,
          id: self._id,
          i18nKey: "productDetail.publishProductVisible",
          autoHide: true,
          dismissable: false
        });
      }
      return Alerts.add(self.title + " is hidden", "warning", {
        placement: "productGridItem",
        type: self._id,
        id: self._id,
        i18nKey: "productDetail.publishProductHidden",
        autoHide: true,
        dismissable: false
      });
    });
  }

});
