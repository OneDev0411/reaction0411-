import React, { PropTypes } from "react";
import classnames from "classnames";

/**
 * Toobar Text
 * @param {Object} props component props
 * @return {node} react element node
 */
const ToolbarGroup = (props) => {
  const baseClassName = classnames({
    "rui": true,
    "toolbar-group": true,
    "left": props.firstChild,
    "right": props.lastChild,
    "visible-mobile": props.visibleOnMobile
  }, props.className);

  return (
    <div className={baseClassName}>{props.children}</div>
  );
};

ToolbarGroup.propTypes = {
  children: PropTypes.node,
  className: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  firstChild: PropTypes.bool,
  lastChild: PropTypes.bool,
  visibleOnMobile: PropTypes.bool
};

export default ToolbarGroup;
