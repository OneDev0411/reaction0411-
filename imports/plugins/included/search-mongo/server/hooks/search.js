import Hooks from "@reactioncommerce/hooks";
import Logger from "@reactioncommerce/logger";
import { Meteor } from "meteor/meteor";
import { ProductSearch, AccountSearch } from "/lib/collections";
import appEvents from "/imports/node-app/core/util/appEvents";
import rawCollections from "/imports/collections/rawCollections";
import {
  buildAccountSearchRecord,
  buildProductSearchRecord
} from "../methods/searchcollections";
import buildOrderSearchRecord from "../no-meteor/util/buildOrderSearchRecord";

appEvents.on("afterAccountCreate", ({ account }) => {
  if (AccountSearch && !Meteor.isAppTest) {
    // Passing forceIndex will run account search index even if
    // updated fields don't match a searchable field
    buildAccountSearchRecord(account._id, ["forceIndex"]);
  }
});

appEvents.on("afterAccountDelete", ({ account }) => {
  if (AccountSearch && !Meteor.isAppTest) {
    AccountSearch.remove(account._id);
  }
});

appEvents.on("afterAccountUpdate", ({ updatedAccount, updatedFields }) => {
  if (AccountSearch && !Meteor.isAppTest) {
    buildAccountSearchRecord(updatedAccount._id, updatedFields);
  }
});

appEvents.on("afterOrderUpdate", ({ order }) => {
  if (!Meteor.isAppTest) {
    Promise.await(buildOrderSearchRecord(rawCollections, order));
  }
});

/**
 * if product is removed, remove product search record
 * @private
 */
Hooks.Events.add("afterRemoveProduct", (doc) => {
  if (ProductSearch && !Meteor.isAppTest && doc.type === "simple") {
    const productId = doc._id;
    ProductSearch.remove(productId);
    Logger.debug(`Removed product ${productId} from ProductSearch collection`);
  }

  return doc;
});

/**
 * @summary Rebuild search record when product is published
 */
Hooks.Events.add("afterPublishProductToCatalog", (product) => {
  Logger.debug(`Rewriting search record for ${product.title}`);
  ProductSearch.remove({ _id: product._id });
  buildProductSearchRecord(product._id);
});

/**
 * after insert
 * @summary should fires on create new variants, on clones products/variants
 * @private
 */
Hooks.Events.add("afterInsertProduct", (doc) => {
  if (ProductSearch && !Meteor.isAppTest && doc.type === "simple") {
    const productId = doc._id;
    buildProductSearchRecord(productId);
    Logger.debug(`Added product ${productId} to ProductSearch`);
  }

  return doc;
});
