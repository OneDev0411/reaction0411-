import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

class ButtonToolbar extends Component {
  render() {
    const baseClassName = classnames({
      "rui": true,
      "btn-toolbar": true
    });

    return (
      <div className={baseClassName}>
        {this.props.children}
      </div>
    );
  }
}

ButtonToolbar.propTypes = {
  children: PropTypes.node
};

export default ButtonToolbar;
