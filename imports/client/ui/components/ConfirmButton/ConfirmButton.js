import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import withStyles from "@material-ui/core/styles/withStyles";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import DangerButton from "../DangerButton";


const styles = (theme) => ({

});

class ConfirmButton extends Component {
  static propTypes = {
    buttonColor: PropTypes.string,
    buttonText: PropTypes.string,
    buttonVariant: PropTypes.string,
    cancelActionText: PropTypes.string,
    children: PropTypes.func,
    confirmActionText: PropTypes.string,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    onConfirm: PropTypes.func,
    onSecondaryConfirm: PropTypes.func,
    secondaryConfirmActionText: PropTypes.string,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
  }

  static defaultProps = {
    cancelActionText: "Cancel",
    confirmActionText: "OK",
    onConfirm() {}
  }

  state = {
    isOpen: false
  }

  handleClose = () => {
    this.setState({
      isOpen: false
    });
  }

  handleConfirm = () => {
    this.props.onConfirm();
    this.handleClose();
  }

  handleOpen = () => {
    this.setState({
      isOpen: true
    });
  }

  handleSecondaryConfirm = () => {
    this.props.onSecondaryConfirm();
    this.handleClose();
  }

  renderButton = () => {
    const { buttonColor, buttonText, buttonVariant } = this.props;

    if (buttonColor === "danger") {
      return <DangerButton color="primary" variant={buttonVariant} onClick={this.handleOpen}>{buttonText}</DangerButton>;
    }

    return (
      <Button color={buttonColor} variant={buttonVariant} onClick={this.handleOpen}>{buttonText}</Button>
    );
  }

  render() {
    const { cancelActionText, confirmActionText, message, onSecondaryConfirm, secondaryConfirmActionText, title } = this.props;
    const { isOpen } = this.state;

    return (
      <Fragment>
        {this.renderButton()}
        <Dialog
          aria-labelledby="confirm-action-dialog-title"
          maxWidth="sm"
          onClose={this.handleClose}
          open={isOpen}
        >
          <DialogTitle id="confirm-action-dialog-title">{title}</DialogTitle>
          {message && (
            <DialogContent>
              <DialogContentText>{message}</DialogContentText>
            </DialogContent>
          )}

          <DialogActions>
            {!onSecondaryConfirm &&
              <Button onClick={this.handleClose} color="primary" variant="outlined">
                {cancelActionText}
              </Button>
            }
            {onSecondaryConfirm &&
              <Button onClick={this.handleSecondaryConfirm} color="primary" variant="outlined">
                {secondaryConfirmActionText}
              </Button>
            }
            <Button onClick={this.handleConfirm} color="primary" variant="contained">
              {confirmActionText}
            </Button>
          </DialogActions>
        </Dialog>
      </Fragment>
    );
  }
}

export default withStyles(styles, { name: "RuiConfirmButton" })(ConfirmButton);
