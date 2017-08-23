import accounting from "accounting-js";

/**
 * getSummary
 * @summary iterates over cart items with computations
 * @param {Array} items - cart.items array
 * @param {Array} prop - path to item property represented by array
 * @param {Array} [prop2] - path to another item property represented by array
 * @param {String} [shopId] - shopId
 * @return {Number} - computations result
 */
function getSummary(items, prop, prop2, shopId) {
  try {
    if (Array.isArray(items)) {
      return items.reduce((sum, item) => {
        if (prop2) {
          if (shopId) {
            if (shopId === item.shopId) {
              // if we're looking for a specific shop's items and this item does match
              return sum + item[prop[0]] * (prop2.length === 1 ? item[prop2[0]] :
                item[prop2[0]][prop2[1]]);
            }
            // If we're looking for a specific shop's items and this item doesn't match
            return sum;
          }
          // No shopId param
          // S + a * b, where b could be b1 or b2
          return sum + item[prop[0]] * (prop2.length === 1 ? item[prop2[0]] :
            item[prop2[0]][prop2[1]]);
        }
        // No prop2 param
        // S + b, where b could be b1 or b2
        return sum + (prop.length === 1 ? item[prop[0]] :
          item[prop[0]][prop[1]]);
      }, 0);
    }
  } catch (e) {
    // If data not prepared we should send a number to avoid exception with
    // `toFixed`. This could happens if user stuck on `completed` checkout stage
    // by some reason.
    return 0;
  }
  return 0;
}

/**
 * Reaction transform collections
 *
 * transform methods used to return cart calculated values
 * cartCount, cartSubTotal, cartShipping, cartTaxes, cartTotal
 * are calculated by a transformation on the collection
 * and are available to use in template as cart.xxx
 * in template: {{cart.cartCount}}
 * in code: Cart.findOne().cartTotal()
 */
export const cartTransform = {
  cartCount() {
    return getSummary(this.items, ["quantity"]);
  },
  cartShipping() {
    // loop through the cart.shipping, sum shipments.
    const rate = getSummary(this.shipping, ["shipmentMethod", "rate"]);
    const handling = getSummary(this.shipping, ["shipmentMethod", "handling"]);
    const shipping = handling + rate || 0;
    return accounting.toFixed(shipping, 2);
  },
  cartSubTotal() {
    const subTotal = getSummary(this.items, ["quantity"], ["variants", "price"]);
    return accounting.toFixed(subTotal, 2);
  },

  /**
   * Aggregates the subtotals by shopId
   * @method cartSubTotalByShop
   * @return {object} An Object with a key for each shopId in the cart where the value is the subtotal for that shop
   */
  cartSubTotalByShop() {
    return this.items.reduce((uniqueShopSubTotals, item) => {
      if (!uniqueShopSubTotals[item.shopId]) {
        const subTotal = getSummary(this.items, ["quantity"], ["variants", "price"], item.shopId);
        uniqueShopSubTotals[item.shopId] = accounting.toFixed(subTotal, 2);
        return uniqueShopSubTotals;
      }
      return uniqueShopSubTotals;
    }, {});
  },

  cartTaxes() {
    // taxes are calculated in a Cart.after.update hooks
    // the tax value stored with the cart is the effective tax rate
    // calculated by line items
    // in the imports/core/taxes plugin
    const tax = this.tax || 0;
    const subTotal = parseFloat(this.cartSubTotal());
    const taxTotal = subTotal * tax;
    return accounting.toFixed(taxTotal, 2);
  },

  /**
   * Aggregates the taxes by shopId
   * @method cartTaxesByShop
   * @return {[type]} An object with a key for each shopId in the cart where the value is the tax total for that shop
   */
  cartTaxesByShop() {
    const subtotals = this.cartSubTotalByShop();
    const taxRates = this.taxRatesByShop;

    return Object.keys(subtotals).reduce((shopTaxTotals, shopId) => {
      if (!shopTaxTotals[shopId]) {
        const shopSubtotal = parseFloat(subtotals[shopId]);
        const shopTaxRate = taxRates && taxRates[shopId] || 0;
        const shopTaxTotal = shopSubtotal * shopTaxRate;
        shopTaxTotals[shopId] = accounting.toFixed(shopTaxTotal, 2);
      }
      return shopTaxTotals;
    }, {});
  },

  cartDiscounts() {
    const discount = this.discount || 0;
    return accounting.toFixed(discount, 2);
  },

  cartTotal() {
    const subTotal = parseFloat(this.cartSubTotal());
    const shipping = parseFloat(this.cartShipping());
    const taxes = parseFloat(this.cartTaxes());
    const discount = parseFloat(this.cartDiscounts());
    const discountTotal = Math.max(0, subTotal - discount);
    const total = discountTotal + shipping + taxes;
    return accounting.toFixed(total, 2);
  },

  /**
   * Aggregates the cart total by shopId
   * @method cartTotalByShop
   * @return {object} An object with a key for each shopId in the cart where the value is the total for that shop
   */
  cartTotalByShop() {
    const subtotals = this.cartSubTotalByShop();
    const taxes = this.cartTaxesByShop();
    const shipping = parseFloat(this.cartShipping());
    // no discounts right now because that will need to support multi-shop

    return Object.keys(subtotals).reduce((shopTotals, shopId) => {
      if (!shopTotals[shopId]) {
        const shopSubtotal = parseFloat(subtotals[shopId]);
        const shopTaxes = parseFloat(taxes[shopId]);
        const shopTotal = shopSubtotal + shopTaxes + shipping;
        shopTotals[shopId] = accounting.toFixed(shopTotal, 2);
      }
      return shopTotals;
    }, {});
  },

  /**
   * cart items organized by shopId
   * @method cartItemsByShop
   * @return {Object} Dict of shopIds with an array of items from that shop that are present in the cart
   */
  cartItemsByShop() {
    return this.items.reduce((itemsByShop, item) => {
      if (!itemsByShop[item.shopId]) {
        itemsByShop[item.shopId] = [item];
      } else {
        itemsByShop[item.shopId].push(item);
      }
      return itemsByShop;
    }, {});
  }
};
