import React, { Component } from "react";
import PropTypes from "prop-types";
import { Components } from "@reactioncommerce/reaction-components";
import { formatPriceString } from "/client/api";

import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import PencilIcon from "mdi-material-ui/Pencil";

class ProductGridItems extends Component {
  static propTypes = {
    displayPrice: PropTypes.func,
    isSearch: PropTypes.bool,
    isSelected: PropTypes.func,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    pdpPath: PropTypes.func,
    product: PropTypes.object,
    productMedia: PropTypes.object
  }

  static defaultProps = {
    onClick() {},
    onDoubleClick() {},
    productMedia: {
      additionalMedia: null,
      primaryMedia: null
    }
  };

  handleDoubleClick = (event) => {
    this.props.onDoubleClick(event);
  }

  handleClick = (event) => {
    this.props.onClick(event);
  }

  renderVisible() {
    return this.props.product.isVisible ? "" : "not-visible";
  }

  renderOverlay() {
    if (this.props.product.isVisible === false) {
      return (
        <div className="product-grid-overlay" />
      );
    }
    return null;
  }

  renderMedia() {
    const { productMedia } = this.props;

    const fileRecord = productMedia.primaryMedia;

    if (fileRecord) {
      const mediaUrl = fileRecord.url({ store: "thumbnail" });
      return (
        <img alt="" src={mediaUrl} height={30} />
      );
    }

    return (
      <span>{"-"}</span>
    );
  }

  renderNotices() {
    const { product } = this.props;

    return (
      <div className="grid-alerts">
        <Components.GridItemNotice product={product} />
        <Components.GridItemControls product={product} />
      </div>
    );
  }

  renderGridContent() {
    return (
      <div className="grid-content">
        <a
          href={this.props.pdpPath()}
          data-event-category="grid"
          data-event-action="product-click"
          data-event-label="grid product click"
          data-event-value={this.props.product._id}
          onDoubleClick={this.handleDoubleClick}
          onClick={this.handleClick}
        >
          <div className="overlay">
            <div className="overlay-title">{this.props.product.title}</div>
            <div className="currency-symbol">{formatPriceString(this.props.displayPrice())}</div>
            {this.props.isSearch &&
                <div className="overlay-description">{this.props.product.description}</div>
            }
          </div>
        </a>
      </div>
    );
  }

  handleSelect = (event) => {
    console.log("event.target.checked", event.target.checked);

    this.props.onSelect(event.target.checked, this.props.product);
  }

  render() {
    const { isSearch, isSelected, pdpPath, product } = this.props;

    const productItem = (
      <TableRow className={`product-table-row-item ${isSelected() ? "active" : ""}`}>
        <TableCell>
          <Checkbox
            onClick={this.handleSelect}
            checked={isSelected()}
          />
        </TableCell>
        <TableCell>
          {this.renderMedia()}
        </TableCell>
        <TableCell>
          {product.title}
        </TableCell>
        <TableCell>
          {formatPriceString(this.props.displayPrice())}
        </TableCell>
        <TableCell>
          {this.renderNotices()}
        </TableCell>
        <TableCell>
          <IconButton onClick={this.handleDoubleClick}>
            <PencilIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    );

    return productItem;
  }
}

export default ProductGridItems;
