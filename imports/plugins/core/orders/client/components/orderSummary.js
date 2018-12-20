import React, { Component } from "react";
import PropTypes from "prop-types";
import { withMoment, Components } from "@reactioncommerce/reaction-components";
import { Badge, ClickToCopy } from "@reactioncommerce/reaction-ui";
import { formatPriceString } from "/client/api";
import { getOrderRiskBadge, getOrderRiskStatus, getShippingInfo, getTaxRiskStatus } from "../helpers";

class OrderSummary extends Component {
  static propTypes = {
    dateFormat: PropTypes.func,
    moment: PropTypes.func,
    order: PropTypes.object,
    printableLabels: PropTypes.func,
    shipmentStatus: PropTypes.func,
    tracking: PropTypes.func
  }

  badgeStatus() {
    const { order } = this.props;
    const orderStatus = order && order.workflow && order.workflow.status;

    if (orderStatus === "new") {
      return "info";
    } else if (orderStatus === "coreOrderWorkflow/processing") {
      return "success";
    } else if (orderStatus === "coreOrderWorkflow/canceled") {
      return "danger";
    } else if (orderStatus === "coreOrderWorkflow/completed") {
      return "primary";
    }

    return "default";
  }

  orderLink() {
    const orderId = this.props.order.referenceId;
    return orderId;
  }

  truncateId() {
    const orderId = this.props.order.referenceId;
    const shortId = orderId.slice(-5);

    return shortId;
  }

  render() {
    const { dateFormat, moment, order, printableLabels, tracking } = this.props;

    if (!order) return null;

    const [payment] = order.payments || [];
    const { amount, displayName: paymentDisplayName, processor, transactionId } = payment || {};
    const { address: shippingAddress, shipmentMethod } = getShippingInfo(order);
    const orderPaymentRisk = getOrderRiskStatus(order);
    const orderTaxRisk = getTaxRiskStatus(order);

    return (
      <div>
        <div
          className="order-summary-form-group bg-info"
          style={{ lineHeight: 3, marginTop: -15, marginRight: -15, marginLeft: -15 }}
        >
          <strong style={{ marginLeft: 15 }}>{shippingAddress && shippingAddress.fullName}</strong>
          <div className="invoice-details" style={{ marginRight: 15, position: "relative" }}>
            {order.email}
          </div>
        </div>

        <div className="roll-up-invoice-list">
          <div className="roll-up-content">
            <div style={{ marginBottom: 4 }}>
              <Badge
                badgeSize="large"
                i18nKeyLabel={`cartDrawer.${order.workflow && order.workflow.status}`}
                label={order.workflow && order.workflow.status}
                status={this.badgeStatus()}
              />
              {orderPaymentRisk &&
                <Badge
                  badgeSize="large"
                  className={`risk-info risk-info-detail ${orderPaymentRisk}`}
                  i18nKeyLabel={`admin.orderRisk.${orderPaymentRisk}`}
                  label={orderPaymentRisk}
                  status={getOrderRiskBadge(orderPaymentRisk)}
                />
              }
              {orderTaxRisk &&
                <div className="risk-info risk-tax">
                  <Components.Translation
                    i18nKey="admin.orderRisk.orderTaxRisk"
                    defaultValue="Tax not calculated"
                  />
                </div>
              }
            </div>

            <div className="order-summary-form-group">
              <strong data-i18n="order.orderId">Order ID</strong>
              <div className="invoice-details" style={{ cursor: "pointer" }}>
                <ClickToCopy
                  copyToClipboard={this.orderLink()}
                  displayText={order.referenceId}
                  i18nKeyTooltip="admin.orderWorkflow.summary.copyOrderLink"
                  tooltip="Copy Order Link"
                />
              </div>
            </div>

            <div className="order-summary-form-group">
              <strong data-i18n="order.created">Created</strong>
              <div className="invoice-details">
                {moment && moment(order.createdAt).fromNow()} | {dateFormat(order.createdAt, "MM/D/YYYY")}
              </div>
            </div>

            <div className="order-summary-form-group">
              <strong data-i18n="order.processor">Processor</strong>
              <div className="invoice-details">
                {processor}
              </div>
            </div>

            <div className="order-summary-form-group">
              <strong data-i18n="order.payment">Payment</strong>
              <div className="invoice-details">
                {paymentDisplayName} ({formatPriceString(amount)})
              </div>
            </div>

            <div className="order-summary-form-group">
              <strong data-i18n="order.transaction">Transaction</strong>
              <div className="invoice-details">
                {transactionId}
              </div>
            </div>

            <div className="order-summary-form-group">
              <strong data-i18n="orderShipping.carrier">Carrier</strong>
              <div className="invoice-details">
                {shipmentMethod.carrier} - {shipmentMethod.label}
              </div>
            </div>

            <div className="order-summary-form-group">
              <strong data-i18n="orderShipping.tracking">Tracking</strong>
              <div className="invoice-details">
                {tracking()}
              </div>
            </div>

            {printableLabels() &&
              <div className="order-summary-form-group">
                <strong data-i18n="orderShipping.printLabels">Labels</strong>
                {printableLabels().shippingLabelUrl ?
                  <a className="invoice-details" href={printableLabels().shippingLabelUrl} target="_blank">
                    <span data-i18n="orderShipping.printShippingLabel">Print Shipping</span>
                  </a> :
                  <a className="invoice-details" href={printableLabels().customsLabelUrl} target="_blank">
                    <span data-i18n="orderShipping.printCustomsLabel">Print Customs</span>
                  </a>
                }
              </div>
            }
          </div>
        </div>

        {!!shippingAddress && <div>
          <br/>

          <div className="order-summary-form-group">
            <strong data-i18n="orderShipping.shipTo">Ship to</strong>
            <div className="invoice-details">
              <strong>Phone: </strong>{shippingAddress.phone}
            </div>
          </div>

          <div style={{ marginTop: 4 }}>
            <span>{shippingAddress.fullName}</span>
            <br/>
            <span>{shippingAddress.address1}</span>
            {shippingAddress.address2 && <span><br/>{shippingAddress.address2}</span>}
            <br/>
            <span>
              {shippingAddress.city}, {shippingAddress.region}, {shippingAddress.country} {shippingAddress.postal}
            </span>
          </div>
        </div>}
      </div>
    );
  }
}

export default withMoment(OrderSummary);
