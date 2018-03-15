import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { Products, MediaRecords, Revisions, Packages } from "/lib/collections";
import { Hooks, Logger } from "/server/api";

function handleImageRevision(revision) {
  let result = 0;
  if (revision.changeType === "insert") {
    // TODO: after we've removed the hook, we shouldn't need updates
    result = MediaRecords.direct.update({
      _id: revision.documentId
    }, {
      $set: {
        metadata: revision.documentData
      }
    });
  } else if (revision.changeType === "remove") {
    // TODO: after we've removed the hook, we shouldn't need updates
    result = MediaRecords.direct.update({
      _id: revision.documentId
    }, {
      $set: {
        "metadata.workflow": "archived"
      }
    });
  } else if (revision.changeType === "update") {
    // TODO: after we've removed the hook, we shouldn't need updates
    result = MediaRecords.direct.update({
      _id: revision.documentId
    }, {
      $set: {
        metadata: revision.documentData
      }
    });
    Logger.debug(`setting metadata for ${revision.documentId} to ${JSON.stringify(revision.documentData, null, 4)}`);
  }
  // mark revision published whether we are publishing the image or not
  Revisions.update({
    _id: revision._id
  }, {
    $set: {
      "workflow.status": "revision/published"
    }
  });

  return result;
}

export function updateSettings(settings) {
  check(settings, Object);

  Packages.update({
    name: "reaction-revisions"
  }, {
    $set: {
      settings
    }
  });
}

/**
 * @function
 * @name publishCatalogProduct
 * @description Updates revision and publishes a product.
 *
 * @param {String} userId - currently logged in user
 * @param {Object} selector - selector for product to update
 * @param {Object} modifier - Object describing what parts of the document to update.
 * @param {Object} validation - simple schema validation
 * @return {String} _id of updated document
 */
function publishCatalogProduct(userId, selector, modifier, validation) {
  const product = Products.findOne(selector);
  Hooks.Events.run("beforeUpdateCatalogProduct", product, {
    userId,
    modifier,
    validation,
    publish: true
  });

  return Products.update(selector, modifier, validation);
}

export function discardDrafts(documentIds) {
  check(documentIds, Match.OneOf(String, Array));

  let documentIdArray;

  if (Array.isArray(documentIds)) {
    documentIdArray = documentIds;
  } else {
    documentIdArray = [documentIds];
  }

  const selector = {
    "workflow.status": {
      $nin: [
        "revision/published"
      ]
    },
    "$or": [
      {
        documentId: {
          $in: documentIdArray
        }
      },
      {
        "documentData.ancestors": {
          $in: documentIdArray
        }
      },
      {
        parentDocument: {
          $in: documentIds
        }
      }
    ]
  };

  const result = Revisions.remove(selector);

  return result > 0;
}

Meteor.methods({
  "revisions/settings/update": updateSettings,
  "revisions/discard": discardDrafts,
  "revisions/publish"(documentIds) {
    check(documentIds, Match.OneOf(String, Array));

    // Also publish variants if they have a draft
    let revisions;

    if (Array.isArray(documentIds)) {
      revisions = Revisions.find({
        "workflow.status": {
          $nin: [
            "revision/published"
          ]
        },
        "$or": [
          {
            documentId: {
              $in: documentIds
            }
          },
          {
            "documentData.ancestors": {
              $in: documentIds
            }
          },
          {
            parentDocument: {
              $in: documentIds
            }
          }
        ]
      }).fetch();
    } else {
      revisions = Revisions.find({
        "workflow.status": {
          $nin: [
            "revision/published"
          ]
        },
        "$or": [
          { documentId: documentIds },
          {
            "documentData.ancestors": {
              $in: [documentIds]
            }
          }
        ]
      }).fetch();
    }

    let updatedDocuments = 0;
    if (revisions) {
      for (const revision of revisions) {
        if (!revision.documentType || revision.documentType === "product") {
          const res = publishCatalogProduct(
            this.userId,
            {
              _id: revision.documentId
            },
            {
              $set: revision.documentData
            }
          );
          updatedDocuments += res;
        } else if (revision.documentType === "image") {
          updatedDocuments += handleImageRevision(revision);
        }
      }
    }

    if (updatedDocuments > 0) {
      return {
        status: "success"
      };
    }

    return false;
  }
});
