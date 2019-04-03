import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { Roles } from "meteor/alanning:roles";
import { Accounts, MediaRecords, Orders, Shops } from "/lib/collections";
import { Counts } from "meteor/tmeasday:publish-counts";
import Reaction from "/imports/plugins/core/core/server/Reaction";

Meteor.publish("PaginatedOrders", function (query, options) {
  check(query, Match.Optional(Object));
  check(options, Match.Optional(Object));

  const shopId = Reaction.getUserShopId(this.userId) || Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  if (Roles.userIsInRole(this.userId, ["admin", "owner", "orders"], shopId) === false) {
    return this.ready();
  }

  const limit = (options && options.limit) ? options.limit : 0;
  const skip = (options && options.skip) ? options.skip : 0;

  Counts.publish(this, "orders-count", Orders.find(), {
    noReady: true,
    nonReactive: true
  });
  console.log("query", query);

  return Orders.find({
    shopId,
    ...query
  }, {
    sort: {
      createdAt: -1
    },
    limit,
    skip
  });
});

/**
 * account orders
 */
Meteor.publish("AccountOrders", function (accountId) {
  check(accountId, String);

  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  const account = this.userId ? Accounts.findOne({ userId: this.userId }) : null;
  const contextAccountId = account && account._id;
  if (accountId !== contextAccountId && !Reaction.hasPermission("orders", Reaction.getUserId(), shopId)) {
    return this.ready();
  }

  const ordersCursor = Orders.find({
    accountId,
    shopId
  }, {
    sort: {
      createdAt: -1
    },
    limit: 25
  });

  const shopNamesCursor = Shops.find({}, { fields: { name: 1 } });

  return [ordersCursor, shopNamesCursor];
});

/**
 * completed cart order
 */
Meteor.publish("CompletedCartOrder", (cartId) => {
  check(cartId, String);

  const userId = Reaction.getUserId();
  const account = userId ? Accounts.findOne({ userId }) : null;
  const accountId = account && account._id;

  return Orders.find({
    accountId,
    cartId
  }, { limit: 1 });
});

/**
 * find an order by _id
 */
Meteor.publish("OrderById", (orderId) => {
  check(orderId, String);
  if (this.userId === null) {
    return this.ready();
  }
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  if (Reaction.hasPermission("orders", Reaction.getUserId(), shopId)) {
    return Orders.find({
      _id: orderId
    }, { limit: 1 });
  }

  return this.ready();
});

Meteor.publish("OrderImages", (orderId) => {
  check(orderId, Match.Optional(String));
  if (!orderId) return [];

  const order = Orders.findOne({ _id: orderId });
  if (!order) return [];

  const orderItems = order.shipping.reduce((list, group) => [...list, ...group.items], []);

  // Ensure each of these are unique
  const productIds = [...new Set(orderItems.map((item) => item.productId))];
  const variantIds = [...new Set(orderItems.map((item) => item.variantId))];

  // return image for each the top level product or the variant and let the client code decide which to display
  return MediaRecords.find({
    "$or": [
      {
        "metadata.productId": {
          $in: productIds
        }
      },
      {
        "metadata.variantId": {
          $in: variantIds
        }
      }
    ],
    "metadata.workflow": {
      $nin: ["archived", "unpublished"]
    }
  });
});
