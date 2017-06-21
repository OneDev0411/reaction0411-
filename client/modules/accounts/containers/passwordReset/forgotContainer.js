import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import { i18next } from "/client/api";
import { composeWithTracker } from "/lib/api/compose";
import { MessagesContainer } from "../helpers";
import { Forgot } from "../../components";
import { LoginFormValidation } from "/lib/api";


class ForgotContainer extends Component {
  static propTypes = {
    formMessages: PropTypes.object
  }

  constructor(props) {
    super(props);

    this.state = {
      formMessages: props.formMessages,
      isLoading: false,
      isDisabled: false
    };

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.formMessages = this.formMessages.bind(this);
    this.hasError = this.hasError.bind(this);
  }

  handleFormSubmit = (event, email) => {
    event.preventDefault();

    this.setState({
      isLoading: true
    });

    let newEmail;
    email === undefined ? newEmail = "" : newEmail = email;

    const emailAddress = newEmail.trim();
    const validatedEmail = LoginFormValidation.email(emailAddress);
    const errors = {};

    if (validatedEmail !== true) {
      errors.email = validatedEmail;
    }

    if (_.isEmpty(errors) === false) {
      this.setState({
        isLoading: false,
        formMessages: {
          errors: errors
        }
      });
      return;
    }

    Meteor.call("accounts/sendResetPasswordEmail", { email: emailAddress }, (error) => {
      // Show some message confirming result
      if (error) {
        this.setState({
          isLoading: false,
          formMessages: {
            alerts: [error]
          }
        });
      } else {
        this.setState({
          isLoading: false,
          isDisabled: true,
          formMessages: {
            info: [{
              reason: i18next.t("accountsUI.info.passwordResetSend") || "Password reset mail sent."
            }]
          }
        });
      }
    });
  }

  formMessages = () => {
    return (
      <MessagesContainer
        messages={this.state.formMessages}
      />
    );
  }

  hasError = (error) => {
    // True here means the field is valid
    // We're checking if theres some other message to display
    if (error !== true && typeof error !== "undefined") {
      return true;
    }

    return false;
  }

  render() {
    return (
      <Forgot
        {...this.props}
        onFormSubmit={this.handleFormSubmit}
        loginFormMessages={this.formMessages}
        messages={this.state.formMessages}
        onError={this.hasError}
        isLoading={this.state.isLoading}
        isDisabled={this.state.isDisabled}
      />
    );
  }
}

function composer(props, onData) {
  const formMessages = {};

  onData(null, {
    formMessages
  });
}

export default composeWithTracker(composer)(ForgotContainer);
