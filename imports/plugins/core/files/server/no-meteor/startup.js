import { Meteor } from "meteor/meteor";
import Logger from "@reactioncommerce/logger";
import setUpFileCollections from "./setUpFileCollections";

// This is temporary. createSaveImageJob still imports jobs, which doesn't
// work outside of a Meteor environment.
let saveRemoteImages = () => {};
let saveTempImages = () => {};
if (!Meteor.isFakeMeteor) {
  saveRemoteImages = require("./jobs/saveRemoteImages").default;
  saveTempImages = require("./jobs/saveTempImages").default;
}

/**
 * @summary Called on startup
 * @param {Object} context Startup context
 * @param {Object} context.app The ReactionNodeApp instance
 * @param {Object} context.collections A map of MongoDB collections
 * @returns {undefined}
 */
export default function startup(context) {
  const { app, collections, rootUrl } = context;
  const { MediaRecords } = collections;

  const {
    downloadManager,
    Media,
    remoteUrlWorker,
    fileWorker,
    tempStore
  } = setUpFileCollections({
    absoluteUrlPrefix: rootUrl,
    db: app.db,
    Logger,
    MediaRecords,
    mongodb: app.mongodb
  });

  saveRemoteImages(remoteUrlWorker);
  saveTempImages(fileWorker);

  // Make the Media collection available to resolvers
  collections.Media = Media;

  // Wire up a file download route
  if (app.expressApp) {
    app.expressApp.use("/assets/files", downloadManager.connectHandler);
    app.expressApp.use("/assets/uploads", tempStore.connectHandler);
  }
}
