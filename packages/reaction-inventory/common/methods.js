// Disabled for now, needs more testing.

// // Define a rate limiting rule that matches update attempts by non-admin users
// const addReserveRule = {
//   userId: function (userId) {
//     return Roles.userIsInRole(userId, "createProduct", ReactionCore.getShopId());
//   },
//   type: "subscription",
//   method: "Inventory"
// };
//
// // Define a rate limiting rule that matches backorder attempts by non-admin users
// const addBackorderRule = {
//   userId: function (userId) {
//     return Roles.userIsInRole(userId, "createProduct", ReactionCore.getShopId());
//   },
//   type: "method",
//   method: "inventory/backorder"
// };
//
// // Add the rule, allowing up to 5 messages every 1000 milliseconds.
// DDPRateLimiter.addRule(addReserveRule, 5, 1000);
// DDPRateLimiter.addRule(addBackorderRule, 5, 1000);

//
// Inventory methods
//

Meteor.methods({
  /**
   * inventory/setStatus
   * @summary sets status from one status to a new status. Defaults to "new" to "reserved"
   * @param  {Array} cartItems array of objects of type ReactionCore.Schemas.CartItems
   * @param  {String} status optional - sets the inventory workflow status, defaults to "reserved"
   * @return {undefined} returns undefined
   */
  "inventory/setStatus": function (cartItems, status, currentStatus, notFoundStatus) {
    check(cartItems, [ReactionCore.Schemas.CartItem]);
    check(status, Match.Optional(String));
    check(currentStatus, Match.Optional(String));
    check(notFoundStatus, Match.Optional(String));
    this.unblock();

    // check basic user permissions
    // if (!ReactionCore.hasPermission(["guest", "anonymous"])) {
    //   throw new Meteor.Error(403, "Access Denied");
    // }

    // set defaults
    const reservationStatus = status || "reserved"; // change status to options object
    const defaultStatus = currentStatus || "new"; // default to the "new" status
    const backorderStatus = notFoundStatus || "backorder"; // change status to options object
    let reservationCount = 0;

    // update inventory status for cartItems
    for (let item of cartItems) {
      // check of existing reserved inventory for this cart
      let existingReservations = ReactionCore.Collections.Inventory.find({
        productId: item.productId,
        variantId: item.variants._id,
        shopId: item.shopId,
        orderItemId: item._id
      });

      // define a new reservation
      let availableInventory = ReactionCore.Collections.Inventory.find({
        "productId": item.productId,
        "variantId": item.variants._id,
        "shopId": item.shopId,
        "workflow.status": defaultStatus
      });

      const totalRequiredQty = item.quantity;
      const availableInventoryQty = availableInventory.count();
      let existingReservationQty = existingReservations.count();

      ReactionInventory.Log.info("totalRequiredQty", totalRequiredQty);
      ReactionInventory.Log.info("availableInventoryQty", availableInventoryQty);

      // if we don't have existing inventory we create backorders
      if (totalRequiredQty > availableInventoryQty) {
        // TODO put in a dashboard setting to allow backorder or altenate handler to be used
        let backOrderQty = Number(totalRequiredQty - availableInventoryQty - existingReservationQty);
        ReactionInventory.Log.info(`no inventory found, create ${backOrderQty} ${backorderStatus}`);
        // define a new reservation
        const reservation = {
          productId: item.productId,
          variantId: item.variants._id,
          shopId: item.shopId,
          orderItemId: item._id,
          workflow: {
            status: backorderStatus
          }
        };

        Meteor.call("inventory/backorder", reservation, backOrderQty);
        existingReservationQty = backOrderQty;
      }
      // if we have inventory available, only create additional required reservations
      ReactionInventory.Log.debug("existingReservationQty", existingReservationQty);
      reservationCount = existingReservationQty;
      let newReservedQty = totalRequiredQty - existingReservationQty + 1;
      let i = 1;

      while (i < newReservedQty) {
        // updated existing new inventory to be reserved
        ReactionInventory.Log.info(
          `updating reservation status ${i} of ${newReservedQty - 1}/${totalRequiredQty} items.`);
        // we should be updating existing inventory here.
        // backorder process created additional backorder inventory if there
        // wasn't enough.
        ReactionCore.Collections.Inventory.update({
          "productId": item.productId,
          "variantId": item.variants._id,
          "shopId": item.shopId,
          "workflow.status": "new"
        }, {
          $set: {
            "orderItemId": item._id,
            "workflow.status": reservationStatus
          }
        });
        reservationCount++;
        i++;
      }
    }
    ReactionInventory.Log.info(
      `finished creating ${reservationCount} new ${reservationStatus} reservations`);
    return reservationCount;
  },
  /**
   * inventory/clearStatus
   * @summary used to reset status on inventory item (defaults to "new")
   * @param  {Array} cartItems array of objects ReactionCore.Schemas.CartItem
   * @param  {[type]} status optional reset workflow.status, defaults to "new"
   * @param  {[type]} currentStatus optional matching workflow.status, defaults to "reserved"
   * @return {undefined} undefined
   */
  "inventory/clearStatus": function (cartItems, status, currentStatus) {
    check(cartItems, [ReactionCore.Schemas.CartItem]);
    check(status, Match.Optional(String)); // workflow status
    check(currentStatus, Match.Optional(String));
    this.unblock();

    // // check basic user permissions
    // if (!ReactionCore.hasPermission(["guest", "anonymous"])) {
    //   throw new Meteor.Error(403, "Access Denied");
    // }

    // optional workflow status or default to "new"
    let newStatus = status || "new";
    let oldStatus = currentStatus || "reserved";

    // remove each cart item in inventory
    for (let item of cartItems) {
      // check of existing reserved inventory for this cart
      let existingReservations = ReactionCore.Collections.Inventory.find({
        "productId": item.productId,
        "variantId": item.variants._id,
        "shopId": item.shopId,
        "orderItemId": item._id,
        "workflow.status": oldStatus
      });
      let i = existingReservations.count();
      // reset existing cartItem reservations
      while (i <= item.quantity) {
        ReactionCore.Collections.Inventory.update({
          "productId": item.productId,
          "variantId": item.variants._id,
          "shopId": item.shopId,
          "orderItemId": item._id,
          "workflow.status": oldStatus
        }, {
          $set: {
            "orderItemId": "", // clear order/cart
            "workflow.status": newStatus // reset status
          }
        });
        i++;
      }
    }
    ReactionInventory.Log.info("inventory/clearReserve", newStatus);
    return;
  },
  /**
   * inventory/clearReserve
   * @summary resets "reserved" items to "new"
   * @param  {Array} cartItems array of objects ReactionCore.Schemas.CartItem
   * @return {undefined}
   */
  "inventory/clearReserve": function (cartItems) {
    check(cartItems, [ReactionCore.Schemas.CartItem]);
    return Meteor.call("inventory/clearStatus", cartItems);
  },
  /**
   * inventory/clearReserve
   * converts new items to reserved, or backorders
   * @param  {Array} cartItems array of objects ReactionCore.Schemas.CartItem
   * @return {undefined}
   */
  "inventory/addReserve": function (cartItems) {
    check(cartItems, [ReactionCore.Schemas.CartItem]);
    return Meteor.call("inventory/setStatus", cartItems);
  },
  /**
   * inventory/backorder
   * @summary is used by the cart process to create a new Inventory
   * backorder item, but this could be used for inserting any
   * custom inventory.
   *
   * A note on DDP Limits.
   * As these are wide open we defined some ddp limiting rules http://docs.meteor.com/#/full/ddpratelimiter
   *
   * @param {Object} reservation ReactionCore.Schemas.Inventory
   * @param {Number} backOrderQty number of backorder items to create
   * @returns {Array} inserts into collection and returns array of inserted inventory id
   */
  "inventory/backorder": function (reservation, backOrderQty) {
    check(reservation, ReactionCore.Schemas.Inventory);
    check(backOrderQty, Number);
    this.unblock();

    // check basic user permissions
    // if (!ReactionCore.hasPermission(["guest","anonymous"])) {
    //   throw new Meteor.Error(403, "Access Denied");
    // }

    // set defaults
    const inventoryBackorder = [];
    let newReservation = reservation;
    if (!newReservation.workflow) {
      newReservation.workflow = {
        status: "backorder"
      };
    }

    // insert backorder
    let i = 0;
    while (i < backOrderQty) {
      inventoryId = ReactionCore.Collections.Inventory.insert(newReservation);
      inventoryBackorder.push(inventoryId);
      ReactionInventory.Log.debug("demand created backorder", inventoryId);
      i++;
    }
    return inventoryBackorder;
  },
  //
  // send low stock warnings
  //
  "inventory/lowStock": function (product) {
    check(product, ReactionCore.Schemas.Product);
    // WIP placeholder
    ReactionInventory.Log.info("inventory/lowStock");
    return;
  }
});
