import React, { Component } from "react";
import PropTypes from "prop-types";
import Avatar from "react-avatar";
import moment from "moment";
import classnames from "classnames/dedupe";
import { Reaction, i18next } from "/client/api";
import { Orders } from "/lib/collections";
import { Badge, ClickToCopy, Icon, Translation, Checkbox, Loading, SortableTable } from "@reactioncommerce/reaction-ui";
import OrderTableColumn from "./orderTableColumn";
import OrderBulkActionsBar from "./orderBulkActionsBar";
import { formatPriceString } from "/client/api";
import ProductImage from "./productImage";
import { getOrderRiskBadge, getOrderRiskStatus } from "../helpers";

const classNames = {
  colClassNames: {
    "name": "order-table-column-name",
    "email": "order-table-column-email",
    "date": "order-table-column-date hidden-xs hidden-sm",
    "id": "order-table-column-id hidden-xs hidden-sm",
    "total": "order-table-column-total",
    "shipping": "order-table-column-shipping hidden-xs hidden-sm",
    "status": "order-table-column-status",
    "": "order-table-column-control"
  },
  headerClassNames: {
    "name": "order-table-header-name",
    "email": "order-table-header-email",
    "date": "order-table-header-date hidden-xs hidden-sm",
    "id": "order-table-header-id hidden-xs hidden-sm",
    "total": "order-table-header-total",
    "shipping": "order-table-header-shipping hidden-xs hidden-sm",
    "status": "order-table-header-status",
    "": "order-table-header-control"
  }
};

class OrderTable extends Component {
  static propTypes = {
    displayMedia: PropTypes.func,
    handleBulkPaymentCapture: PropTypes.func,
    handleClick: PropTypes.func,
    handleSelect: PropTypes.func,
    isLoading: PropTypes.object,
    isOpen: PropTypes.bool,
    multipleSelect: PropTypes.bool,
    orderCount: PropTypes.number,
    orders: PropTypes.array,
    query: PropTypes.object,
    renderFlowList: PropTypes.bool,
    selectAllOrders: PropTypes.func,
    selectedItems: PropTypes.array,
    setShippingStatus: PropTypes.func,
    shipping: PropTypes.object,
    toggleShippingFlowList: PropTypes.func
  }

  // helper function to get appropriate billing info
  getBillingInfo(order) {
    return order.billing.find(
      billing => billing.shopId === Reaction.getShopId()
    ) || {};
  }

  /**
   * Fullfilment Badge
   * @param  {Object} order object containing info for order and coreOrderWorkflow
   * @return {string} A string containing the type of Badge
   */
  fulfillmentBadgeStatus(order) {
    const orderStatus = order.workflow.status;

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

  renderOrderButton(order) {
    const startWorkflow = order.workflow.status === "new";
    const classes = classnames({
      "rui": true,
      "btn": true,
      "btn-success": startWorkflow
    });
    const chevronDirection = i18next.dir() === "rtl" ? "left" : "right";

    return (
      <button className={classes} onClick={() => this.props.handleClick(order, startWorkflow)}>
        <Icon icon={`fa fa-chevron-${chevronDirection}`} />
      </button>
    );
  }

  renderOrderInfo(order) {
    const { displayMedia } = this.props;

    return (
      <div className="order-info">
        <div className="order-totals">
          <span className="order-data order-data-date">
            <strong>Date: </strong>
            {moment(order.createdAt).fromNow()} | {moment(order.createdAt).format("MM/D/YYYY")}
          </span>

          <span className="order-data order-data-id">
            <strong>Order ID: </strong>
            <ClickToCopy
              copyToClipboard={order._id}
              displayText={order._id}
              i18nKeyTooltip="admin.orderWorkflow.summary.copyOrderLink"
              tooltip="Copy Order Link"
            />
          </span>

          <span className="order-data order-data-total">
            <strong>Total: {formatPriceString(this.getBillingInfo(order).invoice.total)}</strong>
          </span>
        </div>

        <div className="order-items">
          {order.items.map((item, i) => {
            return (
              <div className="order-item" key={i}>
                <div className="order-item-media">
                  <ProductImage
                    item={item}
                    displayMedia={displayMedia}
                    size="small"
                    badge={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  renderShipmentInfo(order) {
    const emailAddress = order.email || <Translation defaultValue={"Email not availabe"} i18nKey={"admin.orderWorkflow.ordersList.emailNotFound"} />;
    const orderRisk = getOrderRiskStatus(order);

    return (
      <div className="shipment-info">
        <div className="customer-info">
          <Avatar
            email={order.email}
            round={true}
            name={order.shipping[0].address.fullName}
            size={30}
            className="rui-order-avatar"
          />
          <strong>{order.shipping[0].address.fullName}</strong> | {emailAddress}
          {orderRisk &&
            <Badge
              className="risk-info"
              i18nKeyLabel={`admin.orderRisk.${orderRisk}`}
              status={getOrderRiskBadge(orderRisk)}
            />
          }
        </div>
        <div className="workflow-info">
          <Badge
            badgeSize="large"
            i18nKeyLabel={`cartDrawer.${order.shipping[0].workflow.status}`}
            label={order.shipping[0].workflow.status}
            status="basic"
          />
          <Badge
            badgeSize="large"
            i18nKeyLabel={`cartDrawer.${order.workflow.status}`}
            label={order.workflow.status}
            status={this.fulfillmentBadgeStatus(order)}
          />
        </div>
      </div>
    );
  }

  /**
   * Render Sortable Table for the list view for orders
   * @param {Object} orders object containing info for order
   * @return {Component} SortableTable list of orders
   */

  renderOrderCard(order) {
    return (
      <div className="rui card order">
        <div className="content" onClick={() => this.props.handleClick(order, false)}>
          {this.renderShipmentInfo(order)}
          {this.renderOrderInfo(order)}
        </div>
        <div className="controls" onClick={() => this.props.handleClick(order)}>
          {this.renderOrderButton(order)}
        </div>
      </div>
    );
  }

  render() {
    let getTrProps = undefined;
    let getTheadProps = undefined;
    let getTrGroupProps = undefined;
    let getTableProps = undefined;

    const customColumnMetadata = [];

    if (this.props.isOpen) {
      // Render order list column/row data
      const filteredFields = {
        "name": "shipping[0].address.fullName",
        "email": "email",
        "date": "createdAt",
        "id": "_id",
        "total": "billing[0].invoice.total",
        "shipping": "shipping[0].workflow.status",
        "status": "workflow.status",
        "": ""
      };

      const columnNames = Object.keys(filteredFields);

      getTheadProps = () => {
        return {
          className: "order-table-thead"
        };
      };

      getTrGroupProps = () => {
        return {
          className: "order-table-tr-group"
        };
      };

      getTableProps = () => {
        return {
          className: "order-table-list"
        };
      };

      // https://react-table.js.org/#/story/cell-renderers-custom-components
      columnNames.forEach((columnName) => {
        let colHeader = undefined;
        let resizable = true;
        let sortable = true;
        let columnNameLabel;

        // Add custom styles for the column name `name`
        if (columnName === "name") {
          colHeader = () => (
            <div className="order-table-name-cell">
              <Checkbox
                className="order-header-checkbox checkbox-large"
                checked={this.props.multipleSelect}
                name="orders-checkbox"
                onChange={() => this.props.selectAllOrders(this.props.orders, this.props.multipleSelect)}
              />
              <span style={{ marginTop: 10 }}>
                <Translation
                  defaultValue="Name"
                  i18nKey="admin.table.headers.name"
                />
              </span>
            </div>
          );
        } else if (columnName === "") {
          columnNameLabel = "";
          resizable = false;
          sortable = false;
        } else {
          columnNameLabel = i18next.t(`admin.table.headers.${columnName}`);
        }

        const columnMeta = {
          accessor: filteredFields[columnName],
          Header: colHeader ? colHeader : columnNameLabel,
          headerClassName: classNames.headerClassNames[columnName],
          className: classNames.colClassNames[columnName],
          resizable: resizable,
          sortable: sortable,
          Cell: row => (
            <OrderTableColumn
              row={row}
              handleClick={this.props.handleClick}
              handleSelect={this.props.handleSelect}
              selectedItems={this.props.selectedItems}
              fulfillmentBadgeStatus={this.fulfillmentBadgeStatus}
            />
          )
        };
        customColumnMetadata.push(columnMeta);
      });
    } else {
      // Render order detail column/row dat

      const columnMeta = {
        Cell: row => (<div>{this.renderOrderCard(row.original)}</div>)
      };

      customColumnMetadata.push(columnMeta);

      getTheadProps = () => {
        return {
          className: "hidden"
        };
      };

      getTrGroupProps = () => {
        return {
          className: "order-table-details-tr-group"
        };
      };

      getTableProps = () => {
        return {
          className: "order-table-detail"
        };
      };

      getTrProps = () => {
        return {
          className: "order-table-detail-tr"
        };
      };
    }

    return (
      <div className="order-details-table">
        {this.props.isOpen &&
          <OrderBulkActionsBar
            shipping={this.props.shipping}
            multipleSelect={this.props.multipleSelect}
            orders={this.props.orders}
            selectAllOrders={this.props.selectAllOrders}
            selectedItems={this.props.selectedItems}
            setShippingStatus={this.props.setShippingStatus}
            isLoading={this.props.isLoading}
            renderFlowList={this.props.renderFlowList}
            toggleShippingFlowList={this.props.toggleShippingFlowList}
            handleBulkPaymentCapture={this.props.handleBulkPaymentCapture}
          />
        }
        <SortableTable
          tableClassName={`rui order table -highlight ${this.props.selectedItems.length > 0 ?
            "table-header-hidden" :
            "table-header-visible"}`
          }
          publication="CustomPaginatedOrders"
          collection={Orders}
          matchingResultsCount={this.props.orderCount.toString()}
          query={this.props.query}
          columnMetadata={customColumnMetadata}
          externalLoadingComponent={Loading}
          filterType="none"
          selectedRows={this.props.selectedItems}
          getTheadProps={getTheadProps}
          getTrProps={getTrProps}
          getTrGroupProps={getTrGroupProps}
          getPaginationProps={() => {
            return {
              className: "order-table-pagination-visible"
            };
          }}
          getTableProps={getTableProps}
          showPaginationTop={this.props.selectedItems.length ? false : true}
        />
      </div>
    );
  }
}

export default OrderTable;
