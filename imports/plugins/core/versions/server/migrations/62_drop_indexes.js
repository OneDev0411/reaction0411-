import { Migrations } from "meteor/percolate:migrations";
import Logger from "@reactioncommerce/logger";
import rawCollections from "/imports/collections/rawCollections";

const {
  Catalog
} = rawCollections;

/**
 * @private
 * @param {Error} error Error or null
 * @return {undefined}
 */
function handleError(error) {
  // This may fail if the index doesn't exist, which is what we want anyway
  if (error && (typeof error.message !== "string" || !error.message.includes("index not found"))) {
    Logger.warn(error, "Caught error from dropIndex calls in migration 59");
  }
}

/**
 * Drop all indexes that support queries that are no longer expected
 * to be made by any plugins, or that are already supported by other
 * indexes.
 */
Migrations.add({
  version: 62,
  up() {
    Catalog.dropIndex("createdAt_1", handleError);
    Catalog.dropIndex("updatedAt_1", handleError);
  }
});
