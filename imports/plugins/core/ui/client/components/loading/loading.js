import React, { Component } from "react";
import CircularProgress from "../progress/circularProgress";

class Loading extends Component {
  render() {
    return (
      <div className="spinner-container spinner-container-lg">
        <CircularProgress indeterminate={true} />
      </div>
    );
  }
}

export default Loading;
