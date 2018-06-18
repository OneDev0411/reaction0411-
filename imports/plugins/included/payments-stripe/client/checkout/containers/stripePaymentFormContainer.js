import { Meteor } from "meteor/meteor";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { composeWithTracker } from "@reactioncommerce/reaction-components";
import { Reaction } from "/client/api";
import { Packages, Cart } from "/lib/collections";
import { Elements, StripeProvider } from "react-stripe-elements";
import InjectedCardForm from "./injectedCardForm";

class StripePaymentFormContainer extends Component {
  static propTypes = {
    apiKey: PropTypes.string,
    cartId: PropTypes.string
  }

  render() {
    return (
      <StripeProvider apiKey={this.props.apiKey}>
        <Elements
          fonts={[
            { cssSrc: "https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600,700" }
          ]}
        >
          <InjectedCardForm cartId={this.props.cartId} postal={this.props.postal} />
        </Elements>
      </StripeProvider>
    );
  }
}

function composer(props, onData) {
  const subscription = Reaction.Subscriptions.Packages;
  const stripePackage = Packages.findOne({
    name: "reaction-stripe",
    shopId: Reaction.getPrimaryShopId()
  });
  const cart = Cart.findOne({ userId: Meteor.userId() });
  const { billing: [{ address: { postal }}] } = cart;

  if (subscription.ready()) {
    onData(null, {
      apiKey: stripePackage.settings.public.publishable_key,
      cartId: cart._id,
      postal
    });
  } else {
    onData(null, {});
  }
}

const decoratedComponent = composeWithTracker(composer)(StripePaymentFormContainer);

export default decoratedComponent;
