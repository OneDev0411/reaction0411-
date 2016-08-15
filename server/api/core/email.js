import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Job } from "meteor/vsivsi:job-collection";
import { Jobs, Packages, Templates } from "/lib/collections";
import { Logger } from "/server/api";


/**
 * Reaction.Email.send()
 * (Job API doc) https://github.com/vsivsi/meteor-job-collection/#user-content-job-api
 * @param  {Object} options - object containing to/from/subject/html String keys
 * @return {Boolean} returns job object
 */
export function send(options) {
  return new Job(Jobs, "sendEmail", options)
    .retry({
      retries: 5,
      wait: 3 * 60000
    }).save();
}


/**
 * Reaction.Email.getTemplate() - Returns a template source for SSR consumption
 * layout must be defined + template
 * @param {String} template name of the template in either Layouts or fs
 * @returns {Object} returns source
 */
export function getTemplate(template) {
  check(template, String);

  const language = "en";

  const shopLocale = Meteor.call("shop/getLocale");

  if (shopLocale && shopLocale.locale && shopLocale.locale.languages) {
    lang = shopLocale.locale.languages;
  }

  // using layout where in the future a more comprehensive rule based
  // filter of the email templates can be implemented.
  const tpl = Packages.findOne({
    "layout.template": template
  });

  if (tpl) {
    const tplSource = Templates.findOne({ template, language });
    if (tplSource.source) {
      return tplSource.source;
    }
  }

  const file = `email/templates/${template}.html`;

  try {
    return Assets.getText(file);
  } catch (e) {
    Logger.warn(`Template not found: ${file}. Falling back to coreDefault.html`);
    return Assets.getText("email/templates/coreDefault.html");
  }
}
