import React, { Component } from "react";
import PropTypes from "prop-types";
import { Mutation } from "react-apollo";
import withStyles from "@material-ui/core/styles/withStyles";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Address from "@reactioncommerce/components/Address/v1";
import { i18next } from "/client/api";
import ConfirmButton from "/imports/client/ui/components/ConfirmButton";
import cancelOrderItemMutation from "../graphql/mutations/cancelOrderItem";
import OrderCardFulfillmentGroupItem from "./orderCardFulfillmentGroupItem";
import OrderCardFulfillmentGroupTrackingNumber from "./orderCardFulfillmentGroupTrackingNumber";
import OrderCardStatusChip from "./orderCardStatusChip";


const styles = (theme) => ({
  fulfillmentGroupSpacing: {
    marginBottom: theme.spacing.unit * 2
  },
  fulfillmentGroupHeader: {
    marginBottom: theme.spacing.unit * 2
  },
  orderCardInfoTextBold: {
    fontWeight: theme.typography.fontWeightBold
  }
});

class OrderCardFulfillmentGroups extends Component {
  static propTypes = {
    classes: PropTypes.object,
    order: PropTypes.shape({
      fulfillmentGroups: PropTypes.array
    })
  };

  state = {
    shouldRestock: true
  };

  handleCancelOrder(mutation, fulfillmentGroup) {
    const { order } = this.props;
    const { shouldRestock } = this.state;

    if (this.props.hasEditPermission) { // TODO: EK - update to better permission handling
      // We need to loop over every fulfillmentGroup
      // and then loop over every item inside group
      fulfillmentGroup.items.nodes.forEach(async (item) => {
        await mutation({
          variables: {
            input: {
              cancelQuantity: item.quantity,
              itemId: item._id,
              orderId: order._id,
              reason: "Fulfillment group cancelled inside Catalyst operator UI"
            }
          }
        });

        if (shouldRestock) {
          this.handleInventoryRestock(item);
        }
      });
    }
  }

  // TODO: EK - move inventory out of this file?
  handleInventoryRestockCheckbox = (name) => (event) => {
    if (this.props.hasEditPermission) { // TODO: EK - update to better permission handling
      this.setState({
        ...this.state,
        [name]: event.target.checked
      });
    }
  };

  // TODO: EK - move inventory out of this file?
  handleInventoryRestock = (item) => {
    if (this.props.hasEditPermission) { // TODO: EK - update to better permission handling
      // TODO: EK - handle inventory restock
      console.log(" ----- ----- ----- Handle restocking item", item._id);
    }
  }

  renderFulfillmentGroupItems(fulfillmentGroup) {
    return fulfillmentGroup.items.nodes.map((item) => <OrderCardFulfillmentGroupItem key={item._id} item={item} />);
  }

  renderCancelFulfillmentGroupButton = (fulfillmentGroup) => {
    if (this.props.hasEditPermission) { // TODO: EK - update to better permission handling
      const canCancelOrder = (status !== "coreOrderWorkflow/canceled");
      const { shouldRestock } = this.state;

      if (canCancelOrder) {
        return (
          <Mutation mutation={cancelOrderItemMutation}>
            {(mutationFunc) => (
              <ConfirmButton
                buttonColor="danger"
                buttonText={i18next.t("order.cancelGroupLabel", "Cancel group")}
                buttonVariant="outlined"
                cancelActionText={i18next.t("app.close")}
                confirmActionText={i18next.t("order.cancelGroupLabel", "Cancel group")}
                title={i18next.t("order.cancelGroupLabel")}
                message={i18next.t("order.cancelGroup")}
                onConfirm={() => this.handleCancelOrder(mutationFunc, fulfillmentGroup)}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shouldRestock}
                      onChange={this.handleInventoryRestockCheckbox("shouldRestock")}
                      value="shouldRestock"
                    />
                  }
                  label={i18next.t("order.restockInventory")}
                />
              </ConfirmButton>
            )}
          </Mutation>
        );
      }
    }

    return null;
  }

  renderUpdateFulfillmentGroupStatusButton = () => {
    if (this.props.hasEditPermission) { // TODO: EK - update to better permission handling
      return (
        <Button color="primary" variant="contained">{i18next.t("admin.fulfillmentGroups.markAsPacked", "Mark as packed")}</Button>
      );
    }

    return null;
  }

  render() {
    const { classes, order } = this.props;
    const { fulfillmentGroups } = order;
    const totalGroupsCount = fulfillmentGroups.length;

    return fulfillmentGroups.map((fulfillmentGroup, index) => {
      const currentGroupCount = index + 1;
      const { data: { shippingAddress }, status } = fulfillmentGroup;

      return (
        <Card key={fulfillmentGroup._id} className={classes.fulfillmentGroupSpacing} elevation={0}>
          <CardContent>
            <Grid container alignItems="center" className={classes.fulfillmentGroupHeader}>
              <Grid item xs={12} md={6}>
                <Grid container alignItems="center" spacing={8}>
                  <Grid item>
                    <Typography variant="body2" inline={true}>
                      Fulfillment group {currentGroupCount} of {totalGroupsCount}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <OrderCardStatusChip displayStatus={status} status={status} type="shipment" />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={6}>
                <Grid container alignItems="center" justify="flex-end" spacing={8}>
                  <Grid item>
                    <Button size="small" variant="text">{i18next.t("admin.fulfillmentGroups.printShippingLabel", "Print shipping label")}</Button>
                  </Grid>
                  <Grid item>
                    {this.renderCancelFulfillmentGroupButton(fulfillmentGroup)}
                  </Grid>
                  <Grid item>
                    {this.renderUpdateFulfillmentGroupStatusButton(fulfillmentGroup)}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid container spacing={40} className={classes.fulfillmentGroupHeader}>
              <Grid item xs={12} md={6}>
                {this.renderFulfillmentGroupItems(fulfillmentGroup)}
              </Grid>
              <Grid item xs={12} md={6}>
                <Grid container spacing={24}>
                  <Grid item xs={12} md={12}>
                    <Typography variant="body2" className={classes.orderCardInfoTextBold}>
                      Shipping address
                    </Typography>
                    <Address address={shippingAddress} />
                  </Grid>
                  <Grid item xs={12} md={12}>
                    <Typography variant="body2" className={classes.orderCardInfoTextBold}>
                    Shipping method
                    </Typography>
                    <Typography
                      key={fulfillmentGroup._id}
                      variant="body2"
                    >
                      {fulfillmentGroup.selectedFulfillmentOption.fulfillmentMethod.carrier} - {fulfillmentGroup.selectedFulfillmentOption.fulfillmentMethod.displayName} {/* eslint-disable-line */}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={12}>
                    <Typography variant="body2" className={classes.orderCardInfoTextBold}>
                    Tracking number
                    </Typography>
                    <OrderCardFulfillmentGroupTrackingNumber orderId={order._id} fulfillmentGroup={fulfillmentGroup} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      );
    });
  }
}

export default withStyles(styles, { name: "OrderCardFulfillmentGroups" })(OrderCardFulfillmentGroups);
