import React, { Children, Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames/dedupe";

class Menu extends Component {
  handleChange = (event, value, menuItem) => {
    if (this.props.onChange) {
      this.props.onChange(event, value, menuItem);
    }
  }

  renderMenuItems() {
    if (this.props.children) {
      return Children.map(this.props.children, (element) => {
        const newChild = React.cloneElement(element, {
          onClick: this.handleChange
        });
        const baseClassName = classnames({
          active: element.props.value === this.props.value
        }, this.props.className);
        return (
          <li className={baseClassName}>{newChild}</li>
        );
      });
    }
  }

  render() {
    return (
      <ul className="rui menu dropdown-menu" style={this.props.style}>
        {this.renderMenuItems()}
      </ul>
    );
  }
}

Menu.propTypes = {
  attachment: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onChange: PropTypes.func,
  style: PropTypes.object,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number])
};

Menu.defaultProps = {
  attachment: "top"
};

export default Menu;
