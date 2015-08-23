/**
* Tag Schema
*/

ReactionCore.Schemas.Tag = new SimpleSchema({
  name: {
    type: String,
    index: 1
  },
  slug: {
    type: String
  },
  position: {
    type: Number,
    optional: true
  },
  relatedTagIds: {
    type: [String],
    optional: true,
    index: 1
  },
  isTopLevel: {
    type: Boolean
  },
  shopId: {
    type: String,
    index: 1,
    autoValue: ReactionCore.shopIdAutoValue
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
});
