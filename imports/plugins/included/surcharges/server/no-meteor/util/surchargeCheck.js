import operators from "/imports/utils/operators";
import propertyTypes from "/imports/utils/propertyTypes";
import getVariantPrice from "/imports/plugins/custom/reaction-plugin-pricing-engine/server/no-meteor/queries/getVariantPrice";

/**
 * @summary Filter surcharges based on surcharge restriction data
 * @param {Object} context - Context
 * @param {Object} surcharge - surcharge to check attributes and destination against
 * @param {Object} extendCommonOrder - details about the purchase a user wants to make.
 * @returns {Bool} true / false as to whether method is still valid after this check
 */
export async function surchargeCheck(context, surcharge, extendCommonOrder) {
  const { items, shippingAddress } = extendCommonOrder;
  const { attributes, destination } = surcharge;

  const validSurcharge = items.some((item) => { // eslint-disable-line
    if (Array.isArray(attributes) && attributes.length) {
      // Item must meet all attributes to be restricted
      return attributes.every(async (attribute) => {
        let attributeValue = attribute.value;
        // If `prices` object exists, this means we are using the pricing engine,
        // instead of simple `price` field on a Product document.
        // We need to find the correct price from the engine to check against.
        if (attribute.property === "price" && item.prices && Array.isArray(item.prices) && item.prices.length) {
          const variantPrice = await getVariantPrice(context, item);
          const { price } = variantPrice;
          attributeValue = price;
        }

        let attributeFound = operators[attribute.operator](item[attribute.property], propertyTypes[attribute.propertyType](attributeValue));

        // If attribute is an array on the item, use `includes` instead of checking for ===
        // This works for tags, tagIds, and any future attribute that might be an array
        if (Array.isArray(item[attribute.property])) {
          attributeFound = item[attribute.property].includes(attributeValue);
        }

        if (attributeFound && shippingAddress) {
          // If there is no destination restriction, destination restriction is global
          // Return true to restrict this method
          if (!destination || Object.getOwnPropertyNames(destination).length === 0) return attributeFound;

          const { country, postal, region } = destination;

          if (postal && postal.includes(shippingAddress.postal)) {
            return true;
          }

          // Check for an allow list of regions
          if (region && region.includes(shippingAddress.region)) {
            return true;
          }

          // Check for an allow list of countries
          if (country && country.includes(shippingAddress.country)) {
            return true;
          }
        }

        // If shipping location does not match restricted location && attribute, method is not restricted
        return false;
      });
    }

    // If there are no attributes on the surcharge, and destination doesn't exist, don't apply surcharge
    if (!destination) return false;

    const { country, postal, region } = destination;

    // If destination exists, make sure we have a shipping address, and check against it
    if (shippingAddress) {
      if (postal && postal.includes(shippingAddress.postal)) {
        return true;
      }

      // Check for an allow list of regions
      if (region && region.includes(shippingAddress.region)) {
        return true;
      }

      // Check for an allow list of countries
      if (country && country.includes(shippingAddress.country)) {
        return true;
      }
    }

    return false;
  });

  return validSurcharge;
}
