
// Register Themes
// ReactionUI.registerTheme(Assets.getText("private/themes/notFound.css"));
//
ReactionCore.registerPackage({
  label: "Layout",
  name: "reaction-layout",
  icon: "fa fa-object-group",
  autoEnable: true,
  settings: {
    name: "Layout"
  },
  registry: [{
    provides: "dashboard",
    template: "layoutDashboard",
    label: "Layout",
    description: "Layout utilities",
    icon: "fa fa-object-group",
    priority: 4,
    container: "appearance"
  }]
});
