/**
 * @summary Publishes our plugin-specific product fields to the catalog
 * @param {Object} catalogProduct The catalog product that is being built. Should mutate this.
 * @param {Object} input Input data
 * @returns {undefined}
 */
export default async function publishProductToCatalog(catalogProduct, { context, variants }) {
  // Most inventory information is looked up and included at read time, when
  // preparing a response to a GraphQL query, but we need to store these
  // three boolean flags in the Catalog collection to enable sorting
  // catalogItems query results by them.
  // Find all variants + options
  const topVariantsAndTopOptions = variants.filter((variant) => variant.ancestors.length === 1 || variant.ancestors.length === 2);

  // Retrieve inventory information for all top level variants
  const topVariantsAndOptionsInventory = await context.queries.inventoryForProductConfigurations(context, {
    fields: ["isBackorder", "isLowQuantity", "isSoldOut"],
    productConfigurations: topVariantsAndTopOptions.map((option) => ({
      isSellable: !variants.some((variant) => variant.ancestors.includes(option._id)),
      productId: option.ancestors[0],
      productVariantId: option._id
    })),
    shopId: catalogProduct.shopId
  });

  // Add inventory properties to the top level parent product.
  catalogProduct.isBackorder = topVariantsAndOptionsInventory.every(({ inventoryInfo }) => inventoryInfo.isBackorder);
  catalogProduct.isLowQuantity = topVariantsAndOptionsInventory.some(({ inventoryInfo }) => inventoryInfo.isLowQuantity);
  catalogProduct.isSoldOut = topVariantsAndOptionsInventory.every(({ inventoryInfo }) => inventoryInfo.isSoldOut);

  // add inventory props to each top level Variant
  catalogProduct.variants.forEach((variant, variantIndex) => {
    // attempt to find this variant's inventory info
    const foundVariantInventory = topVariantsAndOptionsInventory.find((inventoryInfo) => inventoryInfo.productConfiguration.productVariantId === variant._id);

    // if inventory info was found, add to variant
    if (foundVariantInventory) {
      catalogProduct.variants[variantIndex].isBackorder = foundVariantInventory.inventoryInfo.isBackorder;
      catalogProduct.variants[variantIndex].isLowQuantity = foundVariantInventory.inventoryInfo.isLowQuantity;
      catalogProduct.variants[variantIndex].isSoldOut = foundVariantInventory.inventoryInfo.isSoldOut;
    }

    // add inventory props to each top level option
    variant.options.forEach((option, optionIndex) => {
      const foundOptionInventory = topVariantsAndOptionsInventory.find((inventoryInfo) => inventoryInfo.productConfiguration.productVariantId === option._id);

      // if inventory info was found, add to variant
      if (foundOptionInventory) {
        catalogProduct.variants[variantIndex].options[optionIndex].isBackorder = foundOptionInventory.inventoryInfo.isBackorder;
        catalogProduct.variants[variantIndex].options[optionIndex].isLowQuantity = foundOptionInventory.inventoryInfo.isLowQuantity;
        catalogProduct.variants[variantIndex].options[optionIndex].isSoldOut = foundOptionInventory.inventoryInfo.isSoldOut;
      }
    });
  });
}
