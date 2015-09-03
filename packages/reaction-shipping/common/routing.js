Router.map(function() {
  return this.route('shipping', {
    controller: ShopAdminController,
    path: 'dashboard/shipping',
    template: 'shipping',
    waitOn: function() {
      return ReactionCore.Subscriptions.Packages;
    },
    subscriptions: function() {
      return Meteor.subscribe("Shipping");
    }
  });
});
