Template.reactionSocial.onCreated(function () {
  let self = this;
  return this.autorun(function () {
    const subscription = ReactionCore.Subscriptions.Packages;
    if (subscription.ready()) {
      const socialSettings = ReactionCore.Collections.Packages.findOne({
        name: "reaction-social"
      });
      if (socialSettings) {
        self.socialSettings = socialSettings.settings.public;
      }
    }
  });
});

Template.reactionSocial.helpers({
  settings: function () {
    const template = Template.instance();
    return template && template.socialSettings;
  },
  socialTemplates: function () {
    const templates = [];
    const template = Template.instance();
    if (template && template.socialSettings) {
      let socialSettings = template.socialSettings;
      socialSettings = Object.assign({}, socialSettings,
        Template.currentData());

      if (socialSettings.appsOrder) {
        const appsOrder = socialSettings.appsOrder;
        for (let i = 0; i < appsOrder.length; i++) {
          let app = appsOrder[i];
          if (typeof socialSettings.apps[app] === "object" &&
            socialSettings.apps[app].enabled) {
            templates.push(app);
          }
        }
      }
    }

    return templates;
  }
});
