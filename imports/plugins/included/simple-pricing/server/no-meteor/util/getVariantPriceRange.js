import getPriceRange from "./getPriceRange";

/**
 *
 * @method getVariantPriceRange
 * @summary Create a Product PriceRange object by taking the lowest variant price and the highest variant
 * price to create the PriceRange. If only one variant use that variant's price to create the PriceRange
 * @param {String} variantId - A product variant ID.
 * @param {Object[]} variants - A list of documents from a Products.find call
 * @returns {Object} Product PriceRange object
 */
export default function getVariantPriceRange(variantId, variants) {
  const visibleOptions = variants.filter((option) => option.ancestors.includes(variantId) &&
    option.isVisible && !option.isDeleted);
  if (visibleOptions.length === 0) {
    const thisVariant = variants.find((option) => option._id === variantId);
    return getPriceRange([(thisVariant && thisVariant.price) || 0]);
  }

  const prices = visibleOptions.map((option) => option.price);
  return getPriceRange(prices);
}
