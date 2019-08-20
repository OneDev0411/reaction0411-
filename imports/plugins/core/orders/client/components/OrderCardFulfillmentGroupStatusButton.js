import React from "react";
import PropTypes from "prop-types";
import { Mutation } from "react-apollo";
import Grid from "@material-ui/core/Grid";
import SplitButton from "@reactioncommerce/catalyst/SplitButton";
import { i18next, Reaction } from "/client/api";
import updateOrderFulfillmentGroupMutation from "../graphql/mutations/updateOrderFulfillmentGroup";

/**
 * @name OrderCardFulfillmentGroupStatusButton
 * @param {Object} props Component props
 * @returns {React.Component} returns a React component
 */
function OrderCardFulfillmentGroupStatusButton({ fulfillmentGroup, order }) {
  const hasPermission = Reaction.hasPermission(["reaction-orders", "order/fulfillment"], Reaction.getUserId(), Reaction.getShopId());
  const canUpdateFulfillmentStatus = (fulfillmentGroup.status !== "coreOrderWorkflow/canceled");
  const options = [
    {
      label: i18next.t("status.new"),
      value: "new"
    }, {
      label: i18next.t("status.coreOrderWorkflow/created"),
      value: "coreOrderWorkflow/created"
    }, {
      label: i18next.t("status.coreOrderWorkflow/processing"),
      value: "coreOrderWorkflow/processing"
    }, {
      label: i18next.t("status.coreOrderWorkflow/completed"),
      value: "coreOrderWorkflow/completed"
    }, {
      label: i18next.t("status.coreOrderWorkflow/picked"),
      value: "coreOrderWorkflow/picked"
    }, {
      label: i18next.t("status.coreOrderWorkflow/packed"),
      value: "coreOrderWorkflow/packed"
    }, {
      label: i18next.t("status.coreOrderWorkflow/labeled"),
      value: "coreOrderWorkflow/labeled"
    }, {
      label: i18next.t("status.coreOrderWorkflow/shipped"),
      value: "coreOrderWorkflow/shipped"
    }
  ];

  const handleUpdateFulfillmentGroupStatus = async (mutation, option) => {
    if (hasPermission) {
      await mutation({
        variables: {
          orderFulfillmentGroupId: fulfillmentGroup._id,
          orderId: order._id,
          status: option.value
        }
      });
    }
  };

  if (hasPermission && canUpdateFulfillmentStatus) {
    return (
      <Grid item>
        <Mutation mutation={updateOrderFulfillmentGroupMutation}>
          {(mutationFunc) => (
            <SplitButton
              options={options}
              onClick={(option) => handleUpdateFulfillmentGroupStatus(mutationFunc, option)}
            />
          )}
        </Mutation>
      </Grid>
    );
  }

  return null;
}

OrderCardFulfillmentGroupStatusButton.propTypes = {
  fulfillmentGroup: PropTypes.shape({
    _id: PropTypes.string,
    status: PropTypes.string
  }),
  order: PropTypes.shape({
    _id: PropTypes.string
  })
};

export default OrderCardFulfillmentGroupStatusButton;
