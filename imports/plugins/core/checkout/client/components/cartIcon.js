import React, { Component } from "react";
import PropTypes from "prop-types";
import Velocity from "velocity-animate";
import { Reaction } from "/client/api";

class CartIcon extends Component {
  static propTypes = {
    cart: PropTypes.object
  }

  handleClick = (event) => {
    event.preventDefault();
    const cartDrawer = document.querySelector("#cart-drawer-container");
    Velocity(cartDrawer, { opacity: 1 }, 300, () => {
      Reaction.toggleSession("displayCart");
    });
  }

  render() {
    return (
      <div className="cart-icon" onClick={this.handleClick}>
        <span data-event-category="cart">
          <i className="fa fa-shopping-cart fa-2x" />
        </span>
        <div className="badge">{this.props.cart ? this.props.cart.cartCount() : 0}</div>
      </div>
    );
  }
}

export default CartIcon;
