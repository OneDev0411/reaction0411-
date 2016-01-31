/**
 * ReactionRegistry.loadSettings
 * @description
 * This basically allows you to "hardcode" all the settings. You can change them
 * via admin etc for the session, but when the server restarts they'll
 * be restored back to the supplied json
 *
 * All settings are private unless added to `settings.public`
 *
 * Meteor account services can be added in `settings.services`
 * @summary updates package settings, accepts json string
 * @param {Object} json - json object to insert
 * @return {Boolean} boolean -  returns true on insert
 * @example
 *  ReactionRegistry.loadSettings Assets.getText("settings/reaction.json")
 */
ReactionRegistry.loadSettings = function (json) {
  check(json, String);
  let exists;
  let service;
  let services;
  let settings;
  let validatedJson = EJSON.parse(json);

  // validate json and error out if not an array
  if (!_.isArray(validatedJson[0])) {
    ReactionCore.Log.warn(
      "Load Settings is not an array. Failed to load settings.");
    return;
  }

  // loop settings and upsert packages.
  for (let pkg of validatedJson) {
    for (let item of pkg) {
      exists = ReactionCore.Collections.Packages.findOne({
        name: item.name
      });
      //
      // TODO migrate functionality to ReactionImport
      // ReactionImport.package(item, shopId);
      //
      // insert into the Packages collection
      if (exists) {
        result = ReactionCore.Collections.Packages.upsert({
          name: item.name
        }, {
          $set: {
            settings: item.settings,
            enabled: item.enabled
          }
        }, {
          multi: true,
          upsert: true,
          validate: false
        });
      }
      // sets the private settings of various
      // accounts authentication services
      if (item.settings.services) {
        for (services of item.settings.services) {
          for (service in services) {
            // actual settings for the service
            if ({}.hasOwnProperty.call(services, service)) {
              settings = services[service];
              ServiceConfiguration.configurations.upsert({
                service: service
              }, {
                $set: settings
              });
              ReactionCore.Log.info("service configuration loaded: " +
                item.name + " | " + service);
            }
          }
        }
      }
      ReactionCore.Log.info(`loaded local package data: ${item.name}`);
    }
  }
};
