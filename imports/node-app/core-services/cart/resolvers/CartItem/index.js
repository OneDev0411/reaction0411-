import { encodeCartItemOpaqueId } from "@reactioncommerce/reaction-graphql-xforms/cart";
import { resolveShopFromShopId } from "@reactioncommerce/reaction-graphql-utils";
import productTags from "./productTags.js";

export default {
  _id: (node) => encodeCartItemOpaqueId(node._id),
  productTags,
  shop: resolveShopFromShopId
};
