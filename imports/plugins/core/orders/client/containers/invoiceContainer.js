import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { composeWithTracker } from "@reactioncommerce/reaction-components";
import { TranslationProvider } from "/imports/plugins/core/ui/client/providers";
import Invoice from "../components/invoice.js";

class InvoiceContainer extends Component {
  static propTypes = {
    canMakeAdjustments: PropTypes.bool,
    collection: PropTypes.string,
    discounts: PropTypes.bool,
    hasRefundingEnabled: PropTypes.bool,
    invoice: PropTypes.object,
    isFetching: PropTypes.bool,
    orderId: PropTypes.string,
    paymentCaptured: PropTypes.bool,
    refunds: PropTypes.array
  }

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    };
    this.handleClick = this.handleClick.bind(this);
    this.dateFormat = this.dateFormat.bind(this);
  }

  dateFormat = (context, block) => {
    const f = block || "MMM DD, YYYY hh:mm:ss A";
    return moment(context).format(f);
  }

  handleClick = (event) => {
    event.preventDefault();
    this.setState({
      isOpen: true
    });
  }

  render() {
    const {
      canMakeAdjustments, paymentCaptured,
      discounts, invoice, orderId, refunds,
      isFetching, collection, hasRefundingEnabled
    } = this.props;

    return (
      <TranslationProvider>
        <Invoice
          canMakeAdjustments={canMakeAdjustments}
          paymentCaptured={paymentCaptured}
          isOpen={this.state.isOpen}
          discounts={discounts}
          handleClick={this.handleClick}
          invoice={invoice}
          orderId={orderId}
          refunds={refunds}
          dateFormat={this.dateFormat}
          isFetching={isFetching}
          collection={collection}
          hasRefundingEnabled={hasRefundingEnabled}
        />
      </TranslationProvider>
    );
  }
}

const composer = (props, onData) => {
  onData(null, {
    canMakeAdjustments: props.canMakeAdjustments,
    paymentCaptured: props.paymentCaptured,
    discounts: props.discounts,
    invoice: props.invoice,
    orderId: props.orderId,
    refunds: props.refunds,
    isFetching: props.isFetching,
    collection: props.collection
  });
};

export default composeWithTracker(composer)(InvoiceContainer);
