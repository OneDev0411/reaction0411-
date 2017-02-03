import React, { Component, PropTypes } from "react";
import Blaze from "meteor/gadicc:blaze-react-component";
import {
  FlatButton,
  Toolbar,
  ToolbarGroup,
  Switch,
  Icon,
  VerticalDivider
} from "/imports/plugins/core/ui/client/components";
import { Translatable } from "/imports/plugins/core/ui/client/providers";

/** TMP **/
import { Reaction } from "/client/api";

class PublishControls extends Component {
  static propTypes = {
    dashboardHeaderTemplate: PropTypes.oneOfType([PropTypes.func, PropTypes.node, PropTypes.string]),
    documentIds: PropTypes.arrayOf(PropTypes.string),
    documents: PropTypes.arrayOf(PropTypes.object),
    isEnabled: PropTypes.bool,
    isPreview: PropTypes.bool,
    onAddProduct: PropTypes.func,
    onViewContextChange: PropTypes.func,
    onVisibilityChange: PropTypes.func,
    packageButtons: PropTypes.arrayOf(PropTypes.object),
    showViewAsControls: PropTypes.bool,
    translation: PropTypes.shape({
      lang: PropTypes.string
    })
  }

  static defaultProps = {
    showViewAsControls: true
  }

  onViewContextChange = (event, isChecked) => {
    if (typeof this.props.onViewContextChange === "function") {
      this.props.onViewContextChange(event, isChecked ? "customer" : "administrator");
    }
  }

  renderViewControls() {
    if (this.props.showViewAsControls) {
      return (
        <FlatButton
          label="Private"
          i18nKeyLabel="app.private"
          i18nKeyToggleOnLabel="app.public"
          toggleOnLabel="Public"
          icon="fa fa-eye-slash"
          onIcon="fa fa-eye"
          toggle={true}
          value="public"
          onValue="private"
          toggleOn={this.isVisible === "public"}
          onToggle={this.handleVisibilityChange}
        />
      );
    }

    return null;
  }

  renderVisibilitySwitch() {
    return (
      <Switch
        i18nKeyLabel={"app."}
        label={"Preview"}
        checked={this.props.isPreview}
        onChange={this.onViewContextChange}
      />
    );
  }

  renderAdminButton() {
    return (
      <FlatButton
        onClick={() => {
          Reaction.showActionView({
            i18nKeyTite: "dashboard.coreTitle",
            title: "Dashboard",
            template: "dashboardPackages"
          });
        }}
      >
      <Icon style={{ fontSize: 24 }} icon="icon icon-reaction-logo" />
    </FlatButton>
    );
  }

  renderAddButton() {
    return (
      <FlatButton
        i18nKeyTooltip={"app.shortcut.addProduct"}
        icon={"fa fa-plus"}
        tooltip={"Add Product"}
        onClick={this.props.onAddProduct}
      />
    );
  }

  renderPackageButons() {
    if (Array.isArray(this.props.packageButtons)) {
      return this.props.packageButtons.map((packageButton, index) => {
        return (
          <FlatButton {...packageButton} key={index} />
        );
      });
    }

    return null;
  }

  renderCustomControls() {
    if (this.props.dashboardHeaderTemplate) {
      return [
        <VerticalDivider key="customControlsVerticaldivider" />,
        <Blaze key="customControls" template={this.props.dashboardHeaderTemplate()} />
      ];
    }

    return null;
  }

  render() {
    return (
      <Toolbar>
        <ToolbarGroup firstChild={true}>
          {this.renderVisibilitySwitch()}
        </ToolbarGroup>
        <ToolbarGroup lastChild={true}>
          {this.renderAddButton()}
          {this.renderPackageButons()}
          {this.renderCustomControls()}
          <VerticalDivider />
          {this.renderAdminButton()}
          {/* this.renderMoreOptionsButton() */}
        </ToolbarGroup>
      </Toolbar>
    );
  }
}

export default Translatable()(PublishControls);
