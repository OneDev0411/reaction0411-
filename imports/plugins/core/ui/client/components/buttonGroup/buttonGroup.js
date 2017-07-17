import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

class ButtonGroup extends Component {
  render() {
    const baseClassName = classnames({
      "rui": true,
      "btn-group": true
    });

    return (
      <div className={baseClassName}>
        {this.props.children}
      </div>
    );
  }
}

ButtonGroup.propTypes = {
  children: PropTypes.node
};

export default ButtonGroup;
