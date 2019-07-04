import React, { Component } from "react";
import PropTypes from "prop-types";
import { Query } from "react-apollo";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";
import withPrimaryShop from "/imports/plugins/core/graphql/lib/hocs/withPrimaryShop";
import OrderCard from "../components/OrderCard";
import orderByReferenceId from "../graphql/queries/orderByReferenceId";


class OrderCardContainer extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        _id: PropTypes.string
      })
    }),
    shop: PropTypes.shape({
      _id: PropTypes.string,
      language: PropTypes.string
    })
  }

  render() {
    const { match: { params }, shop } = this.props;

    const variables = {
      id: params._id,
      language: shop.language,
      shopId: shop._id,
      token: null
    };

    return (
      <Query errorPolicy="all" query={orderByReferenceId} variables={variables}>
        {({ data: orderData, loading: isLoading }) => {
          if (isLoading) return null;
          const { order } = orderData || {};

          if (!order) {
            return <div>Order not found</div>;
          }

          return (
            <OrderCard
              order={order}
            />
          );
        }}
      </Query>
    );
  }
}

export default compose(
  withPrimaryShop,
  withRouter
)(OrderCardContainer);
