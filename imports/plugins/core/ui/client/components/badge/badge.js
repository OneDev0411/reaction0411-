import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames/dedupe";
import { Components, registerComponent } from "@reactioncommerce/reaction-components";

class Badge extends Component {
  renderLabel() {
    if (this.props.label) {
      if (typeof this.props.label === "string") {
        return (
          <Components.Translation
            defaultValue={this.props.label}
            i18nKey={this.props.i18nKeyLabel}
          />
        );
      }
      return (
        <span>
          {this.props.label}
        </span>
      );
    }

    return null;
  }

  render() {
    const { status, badgeSize, className } = this.props;

    const classes = classnames({
      "rui": true,
      "badge": true,
      "badge-small": (badgeSize === null || badgeSize === undefined || badgeSize === "small"),
      "badge-large": badgeSize === "large",
      "badge-basic": status ===  "basic",
      "badge-cta": status === "cta",
      "badge-danger": status === "danger",
      "badge-default": (status === null || status === undefined || status === "default"),
      "badge-info": status === "info",
      "badge-primary": status === "primary",
      "badge-success": status === "success",
      "badge-warning": status ===  "warning"
    }, className);

    return (
      <span className={classes} style={{ display: "inline-flex" }}>
        {this.renderLabel()}
      </span>
    );
  }
}

Badge.propTypes = {
  badgeSize: PropTypes.string,
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  i18nKeyLabel: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  status: PropTypes.string
};

Badge.defaultProps = {
  badgeSize: "small",
  status: "default"
};

registerComponent("Badge", Badge);

export default Badge;
