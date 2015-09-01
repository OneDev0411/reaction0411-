/**
* gridPackage helpers
*
*/

Template.gridPackage.helpers({
  pkgTypeClass: function() {
    var pkg;
    pkg = (function() {
      switch (false) {
        case this.cycle !== 1:
          return {
            "class": "pkg-core-class",
            text: "Core"
          };
        case this.cycle !== 2:
          return {
            "class": "pkg-stable-class",
            text: "Stable"
          };
        case this.cycle !== 3:
          return {
            "class": "pkg-prerelease-class",
            text: "Testing"
          };
        default:
          return {
            "class": "pkg-unstable-class",
            text: "Early"
          };
      }
    }).call(this);
    return pkg;
  }
});

/**
* gridPackage events
*
*/

Template.gridPackage.events({
  "click .enablePkg": function(event, template) {
    var self;
    self = this;
    event.preventDefault();
    return ReactionCore.Collections.Packages.update(template.data.packageId, {
      $set: {
        enabled: true
      }
    }, function(error, result) {
      if (result === 1) {
        Alerts.add(self.label + i18n.t("gridPackage.pkgEnabled"), "success", {
          type: "pkg-enabled-" + self.name,
          autoHide: true
        });
        if (self.route) {
          return Router.go(self.route);
        }
      } else if (error) {
        return Alerts.add(self.label + i18n.t("gridPackage.pkgDisabled"), "warning", {
          type: "pkg-enabled-" + self.name,
          autoHide: true
        });
      }
    });
  },
  "click .disablePkg": function(event, template) {
    var self;
    self = this;
    if (self.name === 'core') {
      return;
    }
    if (confirm("Are you sure you want to disable " + self.label)) {
      event.preventDefault();
      ReactionCore.Collections.Packages.update(template.data.packageId, {
        $set: {
          enabled: false
        }
      }, function(error, result) {
        if (result === 1) {
          return Alerts.add(self.label + i18n.t("gridPackage.pkgDisabled"), "success", {
            type: "pkg-enabled-" + self.name,
            autoHide: true
          });
        } else if (error) {
          throw new Meteor.Error("error disabling package", error);
        }
      });
    }
  },
  "click .pkg-settings, click [data-action=showPackageSettings]": function(event, template) {
    event.preventDefault();
    event.stopPropagation();

    // Show the advanced settings view using this package registry entry
    ReactionCore.showAdvancedSettings(this)

  }
});
