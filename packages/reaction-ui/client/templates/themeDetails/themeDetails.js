
Template.uiThemeDetails.onCreated(function () {
  this.state = new ReactiveDict();
  this.state.setDefault({
    selectedComponent: null,
    theme: {}
  });

  this.subscribe("Themes");

  this.autorun(() => {
    const selectedComponent = ReactionRouter.getQueryParam("component");
    this.state.set("selectedComponent", selectedComponent);

    if (selectedComponent) {
      ReactionCore.showActionView({
        label: "Edit Theme",
        props: {
          size: "large"
        },
        template: "uiThemeEditor"
      });
    }
  });

  this.autorun(() => {
    this.theme = ReactionCore.Collections.Themes.findOne({theme: "base"});
    this.state.set("theme", this.theme);
  });
});

Template.uiThemeDetails.onRendered(function () {

});

Template.uiThemeDetails.helpers({
  activeClassName(componentName) {
    if (Template.instance().state.equals("selectedComponent", componentName)) {
      return "active";
    }
    return "";
  },

  components() {
    const instance = Template.instance();
    const theme = instance.state.get("theme");
    let components = [];

    if (theme) {
      components = theme.components.map((component) => {
        return {
          label: component.label || component.name,
          name: component.name
        };
      });
    }

    return components;
  },

  publishTheme() {
    const instance = Template.instance();
    return () => {
      const theme = instance.state.get("theme") || {};
      Meteor.call("ui/publishTheme", theme, (error) => {
        if (error) {
          Alerts.toast(`Couldn't publish theme ${theme.theme}`, "error");
        }
      });
    };
  }
});

Template.uiThemeDetails.events({
  "click [data-event-action=editComponentTheme]"(event) {
    ReactionRouter.setQueryParams({
      component: event.currentTarget.dataset.component
    });
  }

});
