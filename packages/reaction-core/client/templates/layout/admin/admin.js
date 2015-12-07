
Template.coreAdminLayout.helpers({
  template: function () {
    return ReactionCore.getActionView();
  },

  isDashboard(route) {
    if (route === "dashboard") {
      return true;
    }
    return false;
  },

  adminControlsClassname: function () {
    if (ReactionCore.isActionViewOpen()) {
      return "show-settings";
    }
    return "";
  },

  /**
   * thisApp
   * @return {Object} Registry entry for item
   */
  thisApp() {
    let reactionApp = ReactionCore.Collections.Packages.findOne({
      "registry.provides": "settings",
      "registry.route": Router.current().route.getName()
    }, {
      enabled: 1,
      registry: 1,
      name: 1,
      route: 1
    });
    console.log("Settings", reactionApp);
    if (reactionApp) {
      let settingsData = _.find(reactionApp.registry, function (item) {
        return item.route === Router.current().route.getName() && item.provides === "settings";
      });

      return settingsData;
    }
    return reactionApp;
  }
});

Template.coreAdminLayout.events({
  "click [data-event-action=showPackageSettings]": function () {
    ReactionCore.showActionView();
  },

  /**
   * Submit sign up form
   * @param  {Event} event - jQuery Event
   * @param  {Template} template - Blaze Template
   * @return {void}
   */
  "click .user-accounts-dropdown-apps a": function (event, template) {
    if (this.route === "createProduct") {
      event.preventDefault();
      event.stopPropagation();

      Meteor.call("products/createProduct", (error, productId) => {
        let currentTag;
        let currentTagId;

        if (error) {
          throw new Meteor.Error("createProduct error", error);
        } else if (productId) {
          currentTagId = Session.get("currentTag");
          currentTag = ReactionCore.Collections.Tags.findOne(currentTagId);
          if (currentTag) {
            Meteor.call("products/updateProductTags", productId, currentTag.name, currentTagId);
          }
          Router.go("product", {
            _id: productId
          });
        }
      });
    } else if (this.route) {
      // return Router.go(this.route);
    }
  }
});
