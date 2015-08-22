
/*
 * translations schema
 * mostly just a blackbox for now
 * someday maybe we'll validate the entire schema
 * since ui editing for these values are likely
 */

(function() {
  ReactionCore.Schemas.Translation = new SimpleSchema({
    language: {
      type: String
    },
    i18n: {
      type: String,
      index: 1
    },
    translation: {
      type: Object,
      blackbox: true
    }
  });

}).call(this);
