/**
 * productGridItems helpers
 */

Template.productGridItems.helpers({
  media: function () {
    const media = ReactionCore.Collections.Media.findOne({
      "metadata.productId": this._id,
      "metadata.priority": 0,
      "metadata.toGrid": 1
    }, { sort: { uploadedAt: 1 } });

    return media instanceof FS.File ? media : false;
  },
  additionalMedia: function () {
    const mediaArray = ReactionCore.Collections.Media.find({
      "metadata.productId": this._id,
      "metadata.priority": {
        $gt: 0
      },
      "metadata.toGrid": 1
    }, { limit: 3 });

    if (mediaArray.count() > 1) {
      return mediaArray;
    }

    return false;
  },
  weightClass: function () {
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
  isSelected: function () {
    return _.contains(Session.get("productGrid/selectedProducts"), this._id) ? "active" : "";
  },
  isMediumWeight: function () {
    let position = this.position || {};
    let weight = position.weight || 0;

    if (weight === 1) {
      return true;
    }
    return false;
  },
  isLargeWeight: function () {
    let position = this.position || {};
    let weight = position.weight || 0;
    if (weight === 3) {
      return true;
    }
    return false;
  },
  // TODO is it used?
  shouldShowAdditionalImages: function () {
    if (this.isMediumWeight && this.mediaArray) {
      return true;
    }
    return false;
  }
});

/**
 * productGridItems events
 */

Template.productGridItems.events({
  "click [data-event-action=productClick]": function (event, template) {
    if (ReactionCore.hasPermission("createProduct")) {
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        event.preventDefault();

        let $checkbox = template.$(`input[type=checkbox][value=${this._id}]`);
        const $items = $("li.product-grid-item");
        const $activeItems = $("li.product-grid-item.active");
        const selected = $activeItems.length;

        if (event.shiftKey && selected > 0) {
          const indexes = [
            $items.index($checkbox.parents("li.product-grid-item")),
            $items.index($activeItems.get(0)),
            $items.index($activeItems.get(selected - 1))
          ];
          for (let i = _.min(indexes); i <= _.max(indexes); i++) {
            $checkbox = $("input[type=checkbox]", $items.get(i));
            if ($checkbox.prop("checked") === false) {
              $checkbox.prop("checked", true).trigger("change");
            }
          }
        } else {
          $checkbox.prop("checked", !$checkbox.prop("checked")).trigger("change");
        }
      }
    }
  },
  "click [data-event-action=selectSingleProduct]": function (event, template) {
    event.preventDefault();

    const $checkbox = template.$(`input[type=checkbox][value=${this._id}]`);

    Session.set("productGrid/selectedProducts", []);
    $checkbox.prop("checked", true).trigger("change");
  },
  "click .publish-product": function () {
    ReactionProduct.publishProduct(this);
  },
  "click .delete-product": function (event) {
    event.preventDefault();
    ReactionProduct.maybeDeleteProduct(this);
  },
  "click .update-product-weight": function (event) {
    let position;
    let weight;
    event.preventDefault();
    weight = this.position.weight || 0;
    if (weight < 2) {
      weight++;
    } else {
      weight = 0;
    }
    position = {
      tag: share.tag,
      weight: weight,
      updatedAt: new Date()
    };
    Meteor.call("products/updateProductPosition", this._id, position);
    return Tracker.flush();
  }
});

Template.productGridItems.onRendered(function () {
  if (ReactionCore.hasPermission("createProduct")) {
    let productSort = $(".product-grid-list");

    productSort.sortable({
      items: "> li.product-grid-item",
      cursor: "move",
      opacity: 0.5,
      revert: true,
      scroll: false,
      update: function (event, ui) {
        let position;
        let productId = ui.item[0].id;
        let uiPositions = $(this).sortable("toArray", {
          attribute: "data-id"
        });
        let index = _.indexOf(uiPositions, productId);
        let _i;
        let _len;
        for (index = _i = 0, _len = uiPositions.length; _i < _len; index = ++
          _i) {
          productId = uiPositions[index];
          position = {
            tag: ReactionCore.getCurrentTag(),
            position: index,
            updatedAt: new Date()
          };
          Meteor.call("products/updateProductPosition", productId,
            position);
        }
        return Tracker.flush();
      }
    });
  }
});
