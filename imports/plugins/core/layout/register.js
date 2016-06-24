import { Reaction } from "/server/api";


// Register Themes
Reaction.registerTheme(Assets.getText("themes/notFound.css"));

Reaction.registerPackage({
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
    priority: 1,
    container: "appearance"
  }]
});
