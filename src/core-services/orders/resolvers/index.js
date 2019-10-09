import getConnectionTypeResolvers from "@reactioncommerce/api-utils/graphql/getConnectionTypeResolvers.js";
import { encodeOrderFulfillmentGroupOpaqueId, encodeOrderItemOpaqueId } from "../../../xforms/order.js";
import Mutation from "./Mutation/index.js";
import Order from "./Order/index.js";
import OrderFulfillmentGroup from "./OrderFulfillmentGroup/index.js";
import OrderItem from "./OrderItem/index.js";
import Query from "./Query/index.js";
import Refund from "./Refund/index.js";

export default {
  AddOrderFulfillmentGroupPayload: {
    newFulfillmentGroupId: (node) => encodeOrderFulfillmentGroupOpaqueId(node.newFulfillmentGroupId)
  },
  Mutation,
  Order,
  OrderFulfillmentGroup,
  OrderFulfillmentGroupData: {
    __resolveType(obj) {
      return obj.gqlType;
    }
  },
  OrderItem,
  Query,
  Refund,
  SplitOrderItemPayload: {
    newItemId: (node) => encodeOrderItemOpaqueId(node.newItemId)
  },
  ...getConnectionTypeResolvers("Order"),
  ...getConnectionTypeResolvers("OrdersByAccountId")
};
