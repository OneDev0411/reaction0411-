import {
  encodeOrderFulfillmentGroupOpaqueId,
  xformOrderFulfillmentGroupSelectedOption
} from "@reactioncommerce/reaction-graphql-xforms/order";
import { resolveShopFromShopId } from "@reactioncommerce/reaction-graphql-utils";
import fulfillmentGroupDisplayStatus from "./fulfillmentGroupDisplayStatus";
import items from "./items";
import summary from "./summary";

export default {
  _id: (node) => encodeOrderFulfillmentGroupOpaqueId(node._id),
  data(node) {
    if (node.type === "shipping") {
      return { gqlType: "ShippingOrderFulfillmentGroupData", shippingAddress: node.address };
    }
    return null;
  },
  displayStatus: (node, { language }, context) => fulfillmentGroupDisplayStatus(context, node, language),
  items,
  selectedFulfillmentOption: (node) => xformOrderFulfillmentGroupSelectedOption(node.shipmentMethod, node),
  shop: resolveShopFromShopId,
  status: (node) => node.workflow.status,
  summary
};
