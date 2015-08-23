
/**
* CustomEmailSettings Schema
*/

ReactionCore.Schemas.CustomEmailSettings = new SimpleSchema({
  username: {
    type: String,
    optional: true
  },
  password: {
    type: String,
    optional: true
  },
  host: {
    type: String,
    optional: true
  },
  port: {
    type: Number,
    allowedValues: [25, 587, 465, 475, 2525],
    optional: true
  }
});

/**
* Metafield Schema
*/

ReactionCore.Schemas.Metafield = new SimpleSchema({
  key: {
    type: String,
    max: 30,
    optional: true
  },
  namespace: {
    type: String,
    max: 20,
    optional: true
  },
  scope: {
    type: String,
    optional: true
  },
  value: {
    type: String,
    optional: true
  },
  valueType: {
    type: String,
    optional: true
  },
  description: {
    type: String,
    optional: true
  }
});

/**
* Currency Schema
*/

ReactionCore.Schemas.Currency = new SimpleSchema({
  symbol: {
    type: String,
    defaultValue: "$"
  },
  format: {
    type: String,
    defaultValue: "%s%v"
  },
  precision: {
    type: String,
    defaultValue: "0",
    optional: true
  },
  decimal: {
    type: String,
    defaultValue: ".",
    optional: true
  },
  thousand: {
    type: String,
    defaultValue: ",",
    optional: true
  }
});

/**
* Locale Schema
*/

ReactionCore.Schemas.Locale = new SimpleSchema({
  continents: {
    type: Object,
    blackbox: true
  },
  countries: {
    type: Object,
    blackbox: true
  }
});

/**
* Shop Schema
*/

ReactionCore.Schemas.Shop = new SimpleSchema({
  _id: {
    type: String,
    optional: true
  },
  status: {
    type: String,
    defaultValue: "active"
  },
  name: {
    type: String,
    index: 1
  },
  description: {
    type: String,
    optional: true
  },
  keywords: {
    type: String,
    optional: true
  },
  addressBook: {
    type: [ReactionCore.Schemas.Address],
    optional: true
  },
  domains: {
    type: [String],
    defaultValue: ["localhost"],
    index: 1
  },
  emails: {
    type: [ReactionCore.Schemas.Email],
    optional: true
  },
  currency: {
    label: "Reference currency (not necessarily the currency displayed to user).",
    type: String,
    defaultValue: "USD"
  },
  currencies: {
    type: Object,
    blackbox: true
  },
  locale: {
    type: String,
    defaultValue: "en"
  },
  locales: {
    type: ReactionCore.Schemas.Locale
  },
  languages: {
    type: [Object],
    optional: true
  },
  'languages.$.label': {
    type: String
  },
  'languages.$.i18n': {
    type: String
  },
  'languages.$.enabled': {
    type: Boolean,
    defaultValue: false
  },
  "public": {
    type: String,
    optional: true
  },
  timezone: {
    type: String
  },
  baseUOM: {
    type: String,
    optional: true,
    defaultValue: "OZ",
    label: "Base Unit of Measure"
  },
  metafields: {
    type: [ReactionCore.Schemas.Metafield],
    optional: true
  },
  defaultRoles: {
    type: [String],
    defaultValue: ["guest", "account/profile"]
  },
  defaultWorkflows: {
    type: [Object],
    optional: true
  },
  'defaultWorkflows.$.provides': {
    type: String,
    defaultValue: "simple"
  },
  'defaultWorkflows.$.workflow': {
    type: [String],
    defaultValue: ['checkoutLogin', 'checkoutAddressBook', 'coreCheckoutShipping', 'checkoutReview', 'checkoutPayment']
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
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      if (this.isUpdate) {
        return new Date();
      }
    },
    optional: true
  }
});
