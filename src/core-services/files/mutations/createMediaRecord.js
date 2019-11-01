import Random from "@reactioncommerce/random";
import { MediaRecord } from "../simpleSchemas.js";

/**
 * @summary Create a MediaRecord. It's expected that you've
 *   already separately uploaded the media file itself.
 * @param {Object} context App context
 * @param {Object} input Input data
 * @returns {Object} MediaRecord
 */
export default async function createMediaRecord(context, input) {
  const {
    accountId,
    appEvents,
    validatePermissions,
    validatePermissionsLegacy,
    collections: { MediaRecords },
    userId
  } = context;
  const { mediaRecord, shopId } = input;

  await validatePermissionsLegacy(["media/create"], shopId);
  await validatePermissions("reaction:media", "create", { shopId });

  const doc = {
    ...mediaRecord,
    _id: Random.id(),
    metadata: {
      ...mediaRecord.metadata,
      ownerId: accountId,
      shopId,
      workflow: "published"
    }
  };

  MediaRecord.validate(doc);

  await MediaRecords.insertOne(doc);

  appEvents.emit("afterMediaInsert", { createdBy: userId, mediaRecord: doc });

  return doc;
}
