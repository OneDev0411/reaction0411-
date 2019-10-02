import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import ReactionError from "@reactioncommerce/reaction-error";
import appEvents from "/imports/node-app/core/util/appEvents";
import Reaction from "/imports/plugins/core/core/server/Reaction";
import { MediaRecords } from "/lib/collections";

/**
 * Media-related Meteor methods
 * @namespace Media/Methods
 */

/**
 * @name media/updatePriorities
 * @method
 * @memberof Media/Methods
 * @summary sorting media by array indexes
 * @param {String[]} sortedMediaIDs ID's of sorted media
 * @returns {Boolean} true
 */
export function updateMediaPriorities(sortedMediaIDs) {
  check(sortedMediaIDs, [String]);

  if (!Reaction.hasPermission(["createProduct", "product/admin", "product/update"])) {
    throw new ReactionError("access-denied", "Access Denied");
  }

  // Check to be sure product linked with each media belongs to the current user's current shop
  const shopId = Reaction.getShopId();

  const sortedMediaRecords = MediaRecords.find({
    _id: { $in: sortedMediaIDs }
  }).fetch();

  sortedMediaRecords.forEach((mediaRecord) => {
    if (!mediaRecord.metadata || mediaRecord.metadata.shopId !== shopId) {
      throw new ReactionError("access-denied", `Access Denied. No access to shop ${mediaRecord.metadata.shopId}`);
    }
  });

  if (sortedMediaRecords.length !== sortedMediaIDs.length) {
    throw new ReactionError("not-found", "At least one ID in sortedMediaIDs does not exist");
  }

  sortedMediaIDs.forEach((_id, index) => {
    MediaRecords.update({
      _id
    }, {
      $set: {
        "metadata.priority": index
      }
    });

    const mediaRecord = MediaRecords.findOne({ _id });
    appEvents.emit("afterMediaUpdate", { createdBy: Reaction.getUserId(), mediaRecord });
  });

  return true;
}

/**
 * @name media/updateMediaPriority
 * @method
 * @memberof Media/Methods
 * @summary sorting media by array indexes
 * @param {String} mediaId Media item ID
 * @param {Number} priority Priority
 * @returns {Boolean} true
 */
export function updateMediaPriority(mediaId, priority) {
  check(mediaId, String);
  check(priority, Number);

  if (!Reaction.hasPermission(["createProduct", "product/admin", "product/update"])) {
    throw new ReactionError("access-denied", "Access Denied");
  }

  // Check to be sure product linked with each media belongs to the current user's current shop
  const shopId = Reaction.getShopId();

  const mediaRecord = MediaRecords.findOne({
    _id: mediaId
  });

  if (!mediaRecord.metadata || mediaRecord.metadata.shopId !== shopId) {
    throw new ReactionError("access-denied", `Access Denied. No access to shop ${mediaRecord.metadata.shopId}`);
  }

  MediaRecords.update({
    _id: mediaId
  }, {
    $set: {
      "metadata.priority": priority
    }
  });

  const updatedMediaRecord = MediaRecords.findOne({ _id: mediaId });
  appEvents.emit("afterMediaUpdate", { createdBy: Reaction.getUserId(), updatedMediaRecord });

  return true;
}

Meteor.methods({
  "media/updatePriorities": updateMediaPriorities,
  "media/updatePriority": updateMediaPriority
});
