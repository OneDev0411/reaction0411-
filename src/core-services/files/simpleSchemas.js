import SimpleSchema from "simpl-schema";

const MediaRecordInfo = new SimpleSchema({
  name: String,
  remoteURL: {
    type: String,
    optional: true
  },
  size: SimpleSchema.Integer,
  tempStoreId: {
    type: String,
    optional: true
  },
  type: String,
  updatedAt: Date,
  uploadedAt: Date
});

const MediaRecordMetadata = new SimpleSchema({
  ownerId: {
    type: String,
    optional: true
  },
  priority: {
    type: SimpleSchema.Integer,
    optional: true
  },
  productId: {
    type: String,
    optional: true
  },
  shopId: String,
  type: {
    type: String,
    optional: true
  },
  variantId: {
    type: String,
    optional: true
  },
  workflow: {
    type: String,
    optional: true
  }
});

export const MediaRecord = new SimpleSchema({
  _id: String,
  metadata: MediaRecordMetadata,
  original: MediaRecordInfo
});
