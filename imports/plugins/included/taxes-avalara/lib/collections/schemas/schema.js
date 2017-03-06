import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { TaxPackageConfig } from "/imports/plugins/core/taxes/lib/collections/schemas";

/**
* TaxPackageConfig Schema
*/

export const AvalaraPackageConfig = new SimpleSchema([
  TaxPackageConfig, {
    "settings.avalara": {
      type: Object,
      optional: true
    },
    "settings.avalara.enabled": {
      type: Boolean,
      optional: true,
      defaultValue: false
    },
    "settings.avalara.apiLoginId": {
      type: String,
      label: "Avalara API Login ID"
    },
    "settings.avalara.username": {
      type: String
    },
    "settings.avalara.password": {
      type: String
    },
    "settings.avalara.mode": {
      label: "Production Mode",
      type: Boolean,
      defaultValue: false
    },
    "settings.addressValidation.enabled": {
      label: "Address Validation",
      type: Boolean,
      defaultValue: false
    }
  }
]);
