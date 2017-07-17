import React, { Component } from "react";
import PropTypes from "prop-types";

class CircularProgress extends Component {
  renderInderterminateProgress() {
    return (
      <div className="spinner" />
    );
  }

  render() {
    if (this.props.indeterminate === true) {
      return this.renderInderterminateProgress();
    }

    return null;
  }
}

CircularProgress.propTypes = {
  indeterminate: PropTypes.bool
};

CircularProgress.defaultProps = {
  indeterminate: true
};

export default CircularProgress;
