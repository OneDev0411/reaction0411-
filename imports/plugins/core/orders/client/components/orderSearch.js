import React, { Component } from "react";
import { compose } from "recompose";
import PropTypes from "prop-types";
import { Components, registerComponent, withPermissions } from "@reactioncommerce/reaction-components";

/**
 * React class for Search bar on Order Dashboard
 * @summary horizontal search bar on the order dashboard. can be replaced with registerComponent as "OrderSearch"
 * @property {Function} handleChange - function called to update state field on parent after search input text changes
 */
class OrderSearch extends Component {
  static propTypes = {
    handleChange: PropTypes.func
  };

  state = {
    value: ""
  }

  /**
    * handleChange - handler to call onchange of search input
    * @param {string} event - event object
    * @return {null} -
    */
  handleChange = (event) => {
    const value = event.target.value;

    this.setState({
      value
    });
    this.props.handleChange(value);
  }

  /**
    * handleClear - handler called onclick of search clear text
    * @return {null} -
    */
  handleClear = () => {
    this.setState({
      value: ""
    });
    this.props.handleChange("");
  }

  render() {
    return (
      <div className="order-search">
        <Components.TextField
          className="search-input"
          onChange={this.handleChange}
          value={this.state.value}
          i18nKeyPlaceholder="admin.dashboard.searchLabel"
        />
        <i className="fa fa-search fa-fw"/>
        <Components.Button
          className="search-clear"
          i18nKeyLabel="admin.dashboard.clearSearch"
          label="Clear"
          onClick={this.handleClear}
        />
      </div>
    );
  }
}

registerComponent("OrderSearch", OrderSearch, withPermissions({ roles: ["orders"] }));

export default compose(withPermissions({ roles: ["orders"] }))(OrderSearch);
