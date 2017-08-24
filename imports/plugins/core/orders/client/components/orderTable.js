import React, { Component } from "react";
import PropTypes from "prop-types";
import Avatar from "react-avatar";
import moment from "moment";
import classnames from "classnames/dedupe";
import { Badge, ClickToCopy, Icon, Translation, Checkbox, Loading, SortableTable } from "@reactioncommerce/reaction-ui";
import { Orders } from "/lib/collections";
import OrderTableColumn from "./orderTableColumn";
import OrderBulkActionsBar from "./orderBulkActionsBar";
import { formatPriceString } from "/client/api";
import ProductImage from "./productImage";

const classNames = {
  colClassNames: {
    "Name": "order-table-column-name",
    "Email": "order-table-column-email hidden-xs hidden-sm",
    "Date": "order-table-column-date hidden-xs hidden-sm",
    "ID": "order-table-column-id hidden-xs",
    "Total": "order-table-column-total hidden-xs",
    "Shipping": "order-table-column-shipping hidden-xs hidden-sm",
    "Status": "order-table-column-status",
    "": "order-table-column-control"
  },
  headerClassNames: {
    "Name": "order-table-header-name",
    "Email": "order-table-header-email hidden-xs hidden-sm",
    "Date": "order-table-header-date hidden-xs hidden-sm",
    "ID": "order-table-header-id hidden-xs",
    "Total": "order-table-header-total hidden-xs",
    "Shipping": "order-table-header-shipping hidden-xs hidden-sm",
    "Status": "order-table-header-status",
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
    orders: PropTypes.array,
    renderFlowList: PropTypes.bool,
    selectAllOrders: PropTypes.func,
    selectedItems: PropTypes.array,
    setShippingStatus: PropTypes.func,
    shipping: PropTypes.object,
    toggleShippingFlowList: PropTypes.func
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

    return (
      <button className={classes} onClick={() => this.props.handleClick(order, startWorkflow)}>
        <Icon icon="fa fa-chevron-right" />
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
            <strong>Total: {formatPriceString(order.billing[0].invoice.total)}</strong>
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
        "Name": "shipping[0].address.fullName",
        "Email": "email",
        "Date": "createdAt",
        "ID": "_id",
        "Total": "billing[0].invoice.total",
        "Shipping": "shipping[0].workflow.status",
        "Status": "workflow.status",
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

        // Add custom styles for the column name `name`
        if (columnName === "Name") {
          colHeader = () => (
            <div className="order-table-name-cell">
              <Checkbox
                className="order-header-checkbox checkbox-large"
                checked={this.props.multipleSelect}
                name="orders-checkbox"
                onChange={() => this.props.selectAllOrders(this.props.orders, this.props.multipleSelect)}
              />
              <span style={{ marginTop: 10 }}>{columnName}</span>
            </div>
          );
        }

        if (columnName === "") {
          resizable = false;
          sortable = false;
        }

        const columnMeta = {
          accessor: filteredFields[columnName],
          Header: colHeader ? colHeader : columnName,
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
      <div>
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
          matchingResultsCount="order-count"
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
