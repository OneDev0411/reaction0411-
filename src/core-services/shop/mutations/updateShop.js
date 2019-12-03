import SimpleSchema from "simpl-schema";
import { Email, ParcelSize, ShopAddress, ShopLogoUrls, StorefrontUrls } from "../simpleSchemas.js";

const inputSchema = new SimpleSchema({
  "addressBook": {
    type: Array,
    optional: true
  },
  "allowGuestCheckout": {
    type: Boolean,
    optional: true
  },
  "addressBook.$": {
    type: ShopAddress
  },
  "brandAssets": {
    type: String,
    optional: true
  },
  "description": {
    type: String,
    optional: true
  },
  "defaultParcelSize": {
    type: ParcelSize,
    optional: true
  },
  "emails": {
    type: Array,
    optional: true
  },
  "emails.$": {
    type: Email
  },
  "keywords": {
    type: String,
    optional: true
  },
  "name": {
    type: String,
    optional: true
  },
  "shopId": String,
  "shopLogoUrls": {
    type: ShopLogoUrls,
    optional: true
  },
  "slug": {
    type: String,
    optional: true
  },
  "storefrontUrls": {
    type: StorefrontUrls,
    optional: true
  }
});

const complexSettings = [
  "addressBook",
  "emails",
  "shopLogoUrls",
  "storefrontUrls"
];

/**
 * @name shop/updateShop
 * @memberof Mutations/Shop
 * @method
 * @summary Updates data on the Shop object
 * @param {Object} context - GraphQL execution context
 * @param {Object} input - an object of all mutation arguments that were sent
 * @param {String} input.description - The shop's description
 * @param {Array} input.addressBook - The shop's physical address
 * @param {Boolean} input.allowGuestCheckout - Allow user to checkout without creating an account
 * @param {String} input.brandAssets - A media record id to use as the shop's brand asset
 * @param {Array} input.emails - The shop's primary email address
 * @param {String} input.keywords - The shop's keywords
 * @param {String} input.name - The shop's name
 * @param {String} input.shopId - The shop ID
 * @param {Object} input.shopLogoUrls - An object containing the shop logo urls to update
 * @param {String} input.slug - The shop's slug
 * @param {Object} input.storefrontUrls - An object containing storefront url locations
 * @returns {Promise<Object>} with updated shop
 */
export default async function updateShop(context, input) {
  const { checkPermissions, collections } = context;
  const { Shops } = collections;

  inputSchema.validate(input || {});

  const {
    shopId,
    ...shopSettings
  } = input;

  // Check permission to make sure user is allowed to do this
  // Security check for admin access
  await checkPermissions(["owner", "admin"], shopId);

  // set data to update
  const sets = {};

  Object.keys(shopSettings).forEach((setting) => {
    // Boolean and number settings
    if ((
      typeof shopSettings[setting] === "boolean" ||
      typeof shopSettings[setting] === "number")
      && !complexSettings.includes(setting)
    ) {
      sets[setting] = shopSettings[setting];
      return;
    }

    // Accept a string media record ID for the brandAssets array, and convert it to an
    // array of a single object. The `brandAssets` resolver for shop only returns
    // a single brand asset. "navbarBrandImage" has been the only brand asset used.
    // With the move to have a separate storefront and login apps, brand assets shouldn't
    // be used and other methods, like the settings api or .env vars, should be preferred.
    if (setting === "brandAssets") {
      sets[setting] = [{
        mediaId: shopSettings[setting],
        type: "navbarBrandImage"
      }];
      return;
    }

    // Simple string settings
    if (shopSettings[setting] && !complexSettings.includes(setting)) {
      sets[setting] = shopSettings[setting];
      return;
    }

    // Compound settings
    if (setting === "addressBook") {
      // Currently only supporting one addressBook entry entry per shop
      const addressBookEntry = shopSettings[setting][0];
      Object.keys(addressBookEntry).forEach((key) => {
        sets[`addressBook.0.${key}`] = addressBookEntry[key];
      });
      return;
    }

    if (setting === "defaultParcelSize") {
      sets[setting] = shopSettings[setting];
      return;
    }

    if (setting === "emails") {
      // Currently only supporting one email record entry per shop
      const emailInfo = shopSettings[setting][0];
      Object.keys(emailInfo).forEach((key) => {
        sets[`emails.0.${key}`] = emailInfo[key];
      });
      return;
    }

    if (setting === "shopLogoUrls") {
      Object.keys(shopSettings[setting]).forEach((key) => {
        sets[`shopLogoUrls.${key}`] = shopSettings[setting][key];
      });
      return;
    }

    if (setting === "storefrontUrls") {
      Object.keys(shopSettings[setting]).forEach((key) => {
        sets[`storefrontUrls.${key}`] = shopSettings[setting][key];
      });
    }
  });

  const { value: updatedShop } = await Shops.findOneAndUpdate(
    { _id: shopId },
    {
      $set: {
        ...sets,
        updatedAt: new Date()
      }
    },
    {
      returnOriginal: false
    }
  );

  return updatedShop;
}
