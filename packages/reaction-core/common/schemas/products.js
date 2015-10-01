
/**
* VariantMedia Schema
*/
ReactionCore.Schemas.VariantMedia = new SimpleSchema({
  mediaId: {
    type: String,
    optional: true
  },
  priority: {
    type: Number,
    optional: true
  },
  metafields: {
    type: [ReactionCore.Schemas.Metafield],
    optional: true
  },
  updatedAt: {
    type: Date,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date;
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    },
    denyUpdate: true
  }
});

/**
* ProductPosition Schema
*/
ReactionCore.Schemas.ProductPosition = new SimpleSchema({
  tag: {
    type: String,
    optional: true
  },
  position: {
    type: Number,
    optional: true
  },
  pinned: {
    type: Boolean,
    optional: true
  },
  weight: {
    type: Number,
    optional: true,
    defaultValue: 0,
    min: 0,
    max: 3
  },
  updatedAt: {
    type: Date
  }
});

/**
* ProductVariant Schema
*/

ReactionCore.Schemas.ProductVariant = new SimpleSchema({
  _id: {
    type: String
  },
  parentId: {
    type: String,
    optional: true
  },
  cloneId: {
    type: String,
    optional: true
  },
  index: {
    type: String,
    optional: true
  },
  barcode: {
    label: "Barcode",
    type: String,
    optional: true,
    custom: function() {
      if (Meteor.isClient) {
        if (this.siblingField("type").value === "inventory" && !this.value) {
          return "required";
        }
      }
    }
  },
  compareAtPrice: {
    label: "MSRP",
    type: Number,
    optional: true,
    decimal: true,
    min: 0
  },
  fulfillmentService: {
    label: "Fulfillment service",
    type: String,
    optional: true
  },
  weight: {
    label: "Weight",
    type: Number,
    min: 0,
    optional: true,
    custom: function() {
      if (Meteor.isClient) {
        if (!(this.siblingField("type").value === "inventory" || this.value || this.value === 0)) {
          return "required";
        }
      }
    }
  },
  inventoryManagement: {
    type: Boolean,
    label: "Inventory Tracking",
    optional: true,
    custom: function() {
      if (Meteor.isClient) {
        if (!(this.siblingField("type").value === "inventory" || this.value || this.value === false)) {
          return "required";
        }
      }
    }
  },
  inventoryPolicy: {
    type: Boolean,
    label: "Deny when out of stock",
    optional: true,
    custom: function() {
      if (Meteor.isClient) {
        if (!(this.siblingField("type").value === "inventory" || this.value || this.value === false)) {
          return "required";
        }
      }
    }
  },
  lowInventoryWarningThreshold: {
    type: Number,
    label: "Warn @",
    min: 0,
    optional: true
  },
  inventoryQuantity: {
    type: Number,
    label: "Quantity",
    optional: true,
    custom: function() {
      if (Meteor.isClient) {
        if (this.siblingField("type").value !== "inventory") {
          if (checkChildVariants(this.docId) === 0 && !this.value) {
            return "required";
          }
        }
      }
    }
  },
  price: {
    label: "Price",
    type: Number,
    decimal: true,
    min: 0,
    optional: true,
    custom: function() {
      if (Meteor.isClient) {
        if (this.siblingField("type").value !== "inventory") {
          if (checkChildVariants(this.docId) === 0 && !this.value) {
            return "required";
          }
        }
      }
    }
  },
  sku: {
    label: "SKU",
    type: String,
    optional: true
  },
  type: {
    label: "Type",
    type: String,
    defaultValue: "variant"
  },
  taxable: {
    label: "Taxable",
    type: Boolean,
    optional: true
  },
  title: {
    label: "Label",
    type: String,
    optional: true,
    custom: function() {
      if (Meteor.isClient) {
        if (!(this.siblingField("type").value === "inventory" || this.value)) {
          return "required";
        }
      }
    }
  },
  optionTitle: {
    label: "Option",
    type: String,
    optional: true
  },
  metafields: {
    type: [ReactionCore.Schemas.Metafield],
    optional: true
  },
  createdAt: {
    label: "Created at",
    type: Date,
    optional: true
  },
  updatedAt: {
    label: "Updated at",
    type: Date,
    optional: true
  }
});

/**
* Product Schema
*/

ReactionCore.Schemas.Product = new SimpleSchema({
  _id: {
    type: String,
    optional: true
  },
  cloneId: {
    type: String,
    optional: true
  },
  shopId: {
    type: String,
    autoValue: ReactionCore.shopIdAutoValue,
    index: 1,
    label: "Product ShopId"
  },
  title: {
    type: String
  },
  pageTitle: {
    type: String,
    optional: true
  },
  description: {
    type: String,
    optional: true
  },
  type: {
    label: "Type",
    type: String,
    defaultValue: "simple"
  },
  vendor: {
    type: String,
    optional: true
  },
  metafields: {
    type: [ReactionCore.Schemas.Metafield],
    optional: true
  },
  positions: {
    type: [ReactionCore.Schemas.ProductPosition],
    optional: true
  },
  variants: {
    type: [ReactionCore.Schemas.ProductVariant]
  },
  requiresShipping: {
    label: "Require a shipping address",
    type: Boolean,
    defaultValue: true,
    optional: true
  },
  parcel: {
    type: ReactionCore.Schemas.ShippingParcel,
    optional: true
  },
  hashtags: {
    type: [String],
    optional: true,
    index: 1
  },
  twitterMsg: {
    type: String,
    optional: true,
    max: 140
  },
  facebookMsg: {
    type: String,
    optional: true,
    max: 255
  },
  googleplusMsg: {
    type: String,
    optional: true,
    max: 255
  },
  pinterestMsg: {
    type: String,
    optional: true,
    max: 255
  },
  metaDescription: {
    type: String,
    optional: true
  },
  handle: {
    type: String,
    optional: true,
    index: 1
  },
  isVisible: {
    type: Boolean,
    index: 1
  },
  publishedAt: {
    type: Date,
    optional: true
  },
  publishedScope: {
    type: String,
    optional: true
  },
  templateSuffix: {
    type: String,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date;
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      if (this.isUpdate) {
        return {
          $set: new Date
        };
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    },
    optional: true
  }
});
