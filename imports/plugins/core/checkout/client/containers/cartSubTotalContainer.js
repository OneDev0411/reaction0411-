import { setTimeout } from "timers";
import { compose } from "recompose";
import { registerComponent, composeWithTracker } from "@reactioncommerce/reaction-components";
import getCart from "/imports/plugins/core/cart/client/util/getCart";
import CartSubTotal from "../components/cartSubTotal";

function composer(props, onData) {
  onData(null, {
    isLoading: true
  });

  let stopped = false;
  setTimeout(() => {
    if (stopped) return;
    const { cart } = getCart();
    if (cart) {
      onData(null, {
        cartSubTotal: cart.getSubTotal(),
        cartCount: cart.getCount(),
        cartShipping: cart.getShippingTotal(),
        cartDiscount: cart.getDiscounts(),
        cartSurcharges: cart.getSurcharges(),
        cartTaxes: cart.getTaxTotal(),
        cartTotal: cart.getTotal(),
        isLoading: false
      });
    }
  }, 200);

  return () => {
    stopped = true;
  };
}

const hocs = [
  composeWithTracker(composer)
];

registerComponent("CartSubTotal", CartSubTotal, hocs);

export default compose(...hocs)(CartSubTotal);
