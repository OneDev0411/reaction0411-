import getProductInventoryAvailableToSellQuantity from "./getProductInventoryAvailableToSellQuantity";
import getProductInventoryInStockQuantity from "./getProductInventoryInStockQuantity";
import getTopLevelVariant from "./getTopLevelVariant";
import getVariantInventoryAvailableToSellQuantity from "./getVariantInventoryAvailableToSellQuantity";
import getVariantInventoryInStockQuantity from "./getVariantInventoryInStockQuantity";

/**
 *
 * @method updateParentInventoryFields
 * @summary Get the number of product variants that are currently reserved in an order.
 * This function can take any variant object.
 * @param {Object} item - A product item object, either from the cart or the products catalog
 * @param {Object} collections - Raw mongo collections.
 * @return {undefined}
 */
export default async function updateParentInventoryFields(item, collections) {
  // Since either a cart item or a product catalog item can be provided, we need to determine
  // the parent based on different data
  // If this is a cart item, `productId` and `variantId` are fields on the object
  // If this is a product object, _id is the equivalent of `variantId`, and `ancestors[0]` is the productId
  let updateProductId;
  let updateVariantId;
  if (item.variantId && item.productId) {
    updateProductId = item.productId;
    updateVariantId = item.variantId;
  } else {
    updateProductId = item.ancestors[0]; // eslint-disable-line
    updateVariantId = item._id;
  }

  // Check to see if this item is the top level variant, or an option
  const topLevelVariant = await getTopLevelVariant(updateVariantId, collections);

  // If item is an option, update the quantity on its parent variant too
  if (topLevelVariant._id !== updateVariantId) {
    const variantInventoryAvailableToSellQuantity = await getVariantInventoryAvailableToSellQuantity(topLevelVariant, collections);
    const variantInventoryInStockQuantity = await getVariantInventoryInStockQuantity(topLevelVariant, collections);

    await collections.Products.updateOne(
      {
        _id: topLevelVariant._id
      },
      {
        $set: {
          inventoryAvailableToSell: variantInventoryAvailableToSellQuantity,
          inventoryInStock: variantInventoryInStockQuantity
        }
      }
    );
  }

  // Update the top level product to be the sum of all variant inventory numbers
  const productInventoryAvailableToSellQuantity = await getProductInventoryAvailableToSellQuantity(updateProductId, collections);
  const productInventoryInStockQuantity = await getProductInventoryInStockQuantity(updateProductId, collections);

  await collections.Products.updateOne(
    {
      _id: updateProductId
    },
    {
      $set: {
        inventoryAvailableToSell: productInventoryAvailableToSellQuantity,
        inventoryInStock: productInventoryInStockQuantity
      }
    }
  );
}
