/*
 * ReactionCore.session
 * Create persistent sessions for users
 * The server returns only one record, so findOne will return that record
 * Stores into client session all data contained in server session
 * supports reactivity when server changes the serverSession
 * Stores the server session id into local storage / cookies
 */

ReactionCore.Subscriptions.Sessions = Meteor.subscribe("Sessions", amplify.store("ReactionCore.session"), function () {
  var serverSession = new Mongo.Collection("Sessions").findOne();
  return amplify.store("ReactionCore.session", serverSession._id);
});

// Load order is important here, sessions come before cart.
ReactionCore.Subscriptions.Cart = Meteor.subscribe("Cart", Meteor.userId());

var cart = ReactionCore.Collections.Cart.find({
  userId: Meteor.userId()
});

// detect when a cart has been deleted
// resubscribe will force cart to be rebuilt
var handle = cart.observeChanges({
  removed: function () {
    Meteor.subscribe("Cart", Meteor.userId());
  }
});

/**
 * General Subscriptions
 */
ReactionCore.Subscriptions.Account = Meteor.subscribe("Accounts", Meteor.userId());
ReactionCore.Subscriptions.Profile = Meteor.subscribe("UserProfile", Meteor.userId());

ReactionCore.Subscriptions.Packages = Meteor.subscribe("Packages");
ReactionCore.Subscriptions.Tags = Meteor.subscribe("Tags");
ReactionCore.Subscriptions.Media = Meteor.subscribe("Media");
