Template.productSettings.helpers({
  displayPrice: function() {
    if (this._id) {
      return getProductPriceRange(this._id);
    }
  },

  media: function(variant) {
    console.log('Get media for product', this, 'for variant', variant)
    var defaultImage, variantId, variants;
    variants = (function() {
      var _i, _len, _ref, _results;
      _ref = this.variants;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        variant = _ref[_i];
        if (!variant.parentId) {
          _results.push(variant);
        }
      }
      return _results;
    }).call(this);
    if (variants.length > 0) {
      variantId = variants[0]._id;
      defaultImage = ReactionCore.Collections.Media.findOne({
        'metadata.variantId': variantId,
        'metadata.priority': 0
      });
    }
    if (defaultImage) {
      return defaultImage;
    } else {
      return false;
    }
  },
  additionalMedia: function(variant) {
    var mediaArray, variantId, variants;
    variants = (function() {
      var _i, _len, _ref, _results;
      _ref = this.variants;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        variant = _ref[_i];
        if (!variant.parentId) {
          _results.push(variant);
        }
      }
      return _results;
    }).call(this);
    if (variants.length > 0) {
      variantId = variants[0]._id;
      mediaArray = ReactionCore.Collections.Media.find({
        'metadata.variantId': variantId,
        'metadata.priority': {
          '$gt': 0
        }
      }, {
        limit: 3
      });
    }
    if (mediaArray.count() > 1) {
      return mediaArray;
    } else {
      return false;
    }
  },
  weightClass: function() {
    switch (this.position.weight) {
      case 1:
        return 'product-medium';
      case 2:
        return 'product-large';
      default:
        return 'product-small';
    }
  },
  isMediumWeight: function() {
    if (this.position.weight === 1) {
      return true;
    }
    return false;
  },
  isLargeWeight: function() {
    if (this.position.weight === 3) {
      return true;
    }
    return false;
  },
  shouldShowAdditionalImages: function() {
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
  'click .delete-product': function(event, template) {
    var session;
    session = Session.get('advancedControls');
    if (session.type === 'product') {
      Blaze.remove(template.view);
      return maybeDeleteProduct(session.data);
    }
  },
  'click .close': function(event, template) {
    return Blaze.remove(template.view);
  },


  'click [data-event-action=changeProductWeight]': function (event, template) {

    event.preventDefault();

    var weight = $(event.currentTarget).data('event-data') || 0;
    var position = {
      tag: ReactionCore.getCurrentTag(),
      weight: weight
    };

    console.log('would try to update thing', position, this._id)

    Meteor.call("updateProductPosition", this._id, position);
  },

  'click [data-event-action=publishProduct]': function() {
    var self;
    self = this;
    return Meteor.call("publishProduct", this._id, function(error, result) {
      if (error) {
        Alerts.add(error, "danger", {
          placement: "productGridItem",
          'id': self._id
        });
        return;
      }
      if (result === true) {
        return Alerts.add(self.title + " is now visible", "success", {
          'placement': "productGridItem",
          'type': self._id,
          'id': self._id,
          'i18n_key': "productDetail.publishProductVisible",
          'autoHide': true,
          'dismissable': false
        });
      } else {
        return Alerts.add(self.title + " is hidden", "warning", {
          'placement': "productGridItem",
          'type': self._id,
          'id': self._id,
          'i18n_key': "productDetail.publishProductHidden",
          'autoHide': true,
          'dismissable': false
        });
      }
    });
  }

});

