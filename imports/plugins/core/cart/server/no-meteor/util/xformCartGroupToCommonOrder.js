import { toFixed } from "accounting-js";

/**
 * @param {Object} cart A cart
 * @param {Object} group The cart fulfillment group
 * @param {Object} context App context
 * @returns {Object} Valid CommonOrder from a cart group
 */
export default async function xformCartGroupToCommonOrder(cart, group, context) {
  const { collections } = context;
  const { currencyCode } = cart;

  let items = group.itemIds.map((itemId) => cart.items.find((item) => item._id === itemId));
  items = items.filter((item) => !!item); // remove nulls

  // Get productId's from items, and then use ID's to get full Catalog product
  // to provide missing pricing information
  const catalogItemIds = items.map((item) => item.productId);
  const catalogItemsInGroup = await collections.Catalog.find({ "product._id": { $in: catalogItemIds } }).toArray();

  // We also need to add `subtotal` on each item, based on the current price of that item in
  // the catalog. `getFulfillmentGroupTaxes` uses subtotal prop to calculate the tax.
  // ** If you add any data here, be sure to add the same data to the matching xformOrderGroupToCommonOrder xform
  items = items.map(async (item) => {
    // Get the catalog version of the item to get pricing data from it
    const catalogItem = catalogItemsInGroup.find((catalogItemProduct) => catalogItemProduct.product._id === item.productId);
    const currentVariantPrice = await context.queries.getVariantPrice(context, catalogItem.product, "USD");

    return {
      _id: item._id,
      attributes: item.attributes,
      isTaxable: item.isTaxable,
      parcel: item.parcel,
      price: currentVariantPrice.price,
      productId: item.productId,
      productVendor: item.productVendor,
      quantity: item.quantity,
      shopId: item.shopId,
      subtotal: {
        amount: +toFixed(item.price.amount * item.quantity, 3),
        currencyCode
      },
      taxCode: item.taxCode,
      title: item.title,
      variantId: item.variantId,
      variantTitle: item.variantTitle
    };
  });

  const { address, shipmentMethod, shopId, type: fulfillmentType } = group;
  const shop = await collections.Shops.findOne({ _id: shopId });

  let fulfillmentPrices = {
    handling: null,
    shipping: null,
    total: null
  };
  let fulfillmentMethodId;

  if (shipmentMethod) {
    fulfillmentPrices = {
      handling: {
        amount: shipmentMethod.handling || 0,
        currencyCode
      },
      shipping: {
        amount: shipmentMethod.rate,
        currencyCode
      },
      total: {
        amount: +toFixed((shipmentMethod.handling || 0) + shipmentMethod.rate, 3),
        currencyCode
      }
    };

    fulfillmentMethodId = shipmentMethod._id;
  }

  // TODO: In the future, we should update this with a discounts update
  // Discounts are stored as the sum of all discounts, per cart. This will need to be updated when we refactor discounts to go by group.
  const discountTotal = cart.discount || 0;
  const groupItemTotal = +toFixed(items.reduce((sum, item) => (sum + item.subtotal.amount), 0), 3);
  // orderItemTotal will need to be updated to be the actual total when we eventually have more than one group available
  const orderItemTotal = groupItemTotal;

  const totals = {
    groupDiscountTotal: {
      amount: discountTotal,
      currencyCode: cart.currencyCode
    },
    groupItemTotal: {
      amount: groupItemTotal,
      currencyCode: cart.currencyCode
    },
    groupTotal: {
      amount: +toFixed(groupItemTotal - discountTotal, 3),
      currencyCode: cart.currencyCode
    },
    orderDiscountTotal: {
      amount: discountTotal,
      currencyCode: cart.currencyCode
    },
    orderItemTotal: {
      amount: orderItemTotal,
      currencyCode: cart.currencyCode
    },
    orderTotal: {
      amount: +toFixed(orderItemTotal - discountTotal, 3),
      currencyCode: cart.currencyCode
    }
  };


  return {
    billingAddress: null,
    cartId: cart._id,
    currencyCode: cart.currencyCode,
    fulfillmentMethodId,
    fulfillmentPrices,
    fulfillmentType,
    items,
    orderId: null,
    originAddress: (shop && Array.isArray(shop.addressBook) && shop.addressBook[0]) || null,
    shippingAddress: address || null,
    shopId,
    sourceType: "cart",
    totals
  };
}
