import React, { Fragment, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Mutation } from "react-apollo";
import { Form } from "reacto-form";
import withStyles from "@material-ui/core/styles/withStyles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import InputLabel from "@material-ui/core/InputLabel";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import ErrorsBlock from "@reactioncommerce/components/ErrorsBlock/v1";
import Field from "@reactioncommerce/components/Field/v1";
import TextInput from "@reactioncommerce/components/TextInput/v1";
import { i18next, Reaction } from "/client/api";
import Button from "/imports/client/ui/components/Button";
import createRefundMutation from "../graphql/mutations/createRefund";
import OrderPreviousRefunds from "./OrderPreviousRefunds";

const styles = (theme) => ({
  dividerSpacing: {
    marginBottom: theme.spacing(4),
    marginTop: theme.spacing(4)
  },
  fontWeightSemiBold: {
    fontWeight: theme.typography.fontWeightSemiBold
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  selectEmpty: {
    marginTop: theme.spacing(2)
  }
});

/**
 * @name OrderRefunds
 * @param {Object} props Component props
 * @returns {React.Component} returns a React component
 */
function OrderRefunds(props) {
  const hasPermission = Reaction.hasPermission(["reaction-orders", "order/fulfillment"], Reaction.getUserId(), Reaction.getShopId());
  const { classes, order } = props;
  const { payments } = order;

  // useRef
  const inputLabel = useRef(null);

  // useState
  const [allowShippingRefund, setAllowShippingRefund] = useState(false);
  const [calculateByItem, setCalculateByItem] = useState(false);
  const [labelWidth, setLabelWidth] = useState(0);
  const [refundReasonSelectValues, setRefundReasonSelectValues] = useState({ reason: "" });
  const [refundTotal, setRefundTotal] = useState(0.00);

  // useEffect
  // update label width when refund select is activate
  useEffect(() => {
    setLabelWidth(inputLabel.current.offsetWidth);
  }, []);

  const handleCreateRefund = (data, mutation) => {
    const { amounts } = data;
    const { reason } = refundReasonSelectValues;

    // turn form data into an array of payments that provide paymentID and amount
    // then filter out any amounts that are `null` or `0`
    const paymentsToRefund = Object.keys(amounts).map((paymentId) => ({
      paymentId,
      amount: parseFloat(amounts[paymentId], 10)
    })).filter((payment) => payment.amount && payment.amount > 0);

    paymentsToRefund.forEach((payment) => {
      const variables = {
        amount: payment.amount,
        orderId: order._id,
        paymentId: payment.paymentId
      };

      // Stripe will not accept an empty string or `null` value for the `reason` field,
      // so we include it in the mutation only if there if a value
      if (reason) {
        variables.reason = reason;
      }

      if (hasPermission) {
        mutation({
          variables
        });
      }
    });
  };

  // When refund amounts are changed, add up amounts to display in button
  const handleRefundTotalUpdate = () => {
    const { amounts } = this.form.state.value;

    const reducedRefundTotal = Object.keys(amounts).map((paymentId) => ({
      paymentId,
      amount: parseFloat(amounts[paymentId], 10)
    })).filter((payment) => payment.amount && payment.amount > 0).reduce((acc, value) => acc + value.amount, 0);

    setRefundTotal(() => reducedRefundTotal);
  };

  const handleRefundReasonSelectChange = (event) => {
    handleRefundTotalUpdate();
    setRefundReasonSelectValues((oldValues) => ({
      ...oldValues,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmitForm = () => {
    if (hasPermission) {
      this.form.submit();
    }
  };






  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card elevation={0}>
          <CardHeader
            title={i18next.t("order.amountToRefund", "Amount to refund")}
          />
          <CardContent>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Switch
                    checked={calculateByItem}
                    onChange={() => handleRefundCalculateByItemSwitchChange("calculateByItem")}
                    value="calculateByItem"
                  />
                }
                label={i18next.t("order.calculateRefundByItem", "Calculate refund by item")}
              />
            </FormGroup>
            <Divider className={classes.dividerSpacing} />
            {calculateByItem === true &&
              <Grid container>
                <Grid item xs={12}>
                  <Typography variant="body1">This is the section to render everything by item</Typography>
                  <Divider className={classes.dividerSpacing} />
                </Grid>
              </Grid>
            }
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderPayments()}
              </Grid>
              <Grid item xs={12}>
                {renderReason()}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <OrderPreviousRefunds order={order} />
    </Grid>
  );
}

OrderRefunds.propTypes = {
  classes: PropTypes.object,
  order: PropTypes.object
};

export default withStyles(styles, { name: "RuiOrderRefunds" })(OrderRefunds);
