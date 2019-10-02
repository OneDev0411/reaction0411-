import _ from "lodash";
import Logger from "@reactioncommerce/logger";
import ReactionError from "@reactioncommerce/reaction-error";
import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import * as Collections from "/lib/collections";
import appEvents from "/imports/node-app/core/util/appEvents";
import Reaction from "/imports/plugins/core/core/server/Reaction";
import sendWelcomeEmail from "/imports/plugins/core/accounts/server/util/sendWelcomeEmail";
import generateVerificationTokenObject from "/imports/plugins/core/accounts/server/no-meteor/util/generateVerificationTokenObject";

Meteor.startup(() => {
  /**
   * Make sure initial admin user has verified their
   * email before allowing them to login.
   *
   * http://docs.meteor.com/#/full/accounts_validateloginattempt
   */

  Accounts.validateLoginAttempt((attempt) => {
    if (!attempt.allowed) {
      return false;
    }

    // confirm this is the accounts-password login method
    if (attempt.type !== "password" || attempt.methodName !== "login") {
      return attempt.allowed;
    }

    if (!attempt.user) {
      return attempt.allowed;
    }

    const loginEmail = attempt.methodArguments[0].user.email;
    const adminEmail = process.env.REACTION_EMAIL;

    if (loginEmail && loginEmail === adminEmail) {
      // filter out the matching login email from any existing emails
      const userEmail = _.filter(attempt.user.emails, (email) => email.address === loginEmail);

      // check if the email is verified
      if (!userEmail.length || !userEmail[0].verified) {
        throw new ReactionError("access-denied", "Oops! Please validate your email first.");
      }
    }

    return attempt.allowed;
  });

  /**
   * Reaction Accounts handlers
   * creates a login type "anonymous"
   * default for all unauthenticated visitors
   */
  Accounts.registerLoginHandler((options) => {
    if (!options.anonymous) return {};

    const stampedToken = Accounts._generateStampedLoginToken();
    const userId = Accounts.insertUserDoc({
      services: {
        anonymous: true
      },
      token: stampedToken.token
    });
    const loginHandler = {
      type: "anonymous",
      userId
    };
    return loginHandler;
  });

  /**
   * Accounts.onCreateUser event
   * adding either a guest or anonymous role to the user on create
   * adds Accounts record for reaction user profiles
   * we clone the user into accounts, as the user collection is
   * only to be used for authentication.
   * - defaultVisitorRole
   * - defaultRoles
   * can be overridden from Shops
   *
   * @see: http://docs.meteor.com/#/full/accounts_oncreateuser
   */
  Accounts.onCreateUser((options, user) => {
    const groupToAddUser = options.groupId;
    const roles = {};
    const additionals = {
      name: options && options.name,
      profile: Object.assign({}, options && options.profile)
    };
    if (!user.emails) user.emails = [];

    // init default user roles
    // we won't create users unless we have a shop.
    const shopId = Reaction.getShopId(); // current shop; not primary shop
    if (shopId) {
      // if we don't have user.services we're an anonymous user
      if (!user.services) {
        const group = Collections.Groups.findOne({ slug: "guest", shopId });
        // if no group permissions retrieved from DB, use the default Reaction set
        roles[shopId] = (group && group.permissions) || Reaction.defaultVisitorRoles;
        if (group) {
          additionals.groups = [group._id];
        }
      } else {
        let group;
        if (groupToAddUser) {
          group = Collections.Groups.findOne({ _id: groupToAddUser, shopId });
        } else {
          group = Collections.Groups.findOne({ slug: "customer", shopId });
        }
        // if no group or customer permissions retrieved from DB, use the default Reaction customer set
        roles[shopId] = (group && group.permissions) || Reaction.defaultCustomerRoles;
        if (group) {
          additionals.groups = [group._id];
        }
      }
    }

    // also add services with email defined to user.emails[]
    const userServices = user.services;
    for (const service in userServices) {
      if ({}.hasOwnProperty.call(userServices, service)) {
        const serviceObj = userServices[service];
        if (serviceObj.email) {
          const email = {
            provides: "default",
            address: serviceObj.email,
            verified: true
          };
          user.emails.push(email);
        }
        if (serviceObj.name) {
          user.username = serviceObj.name;
          additionals.profile.name = serviceObj.name;
        }
        // TODO: For now we have here instagram, twitter and google avatar cases
        // need to make complete list
        if (serviceObj.picture) {
          additionals.profile.picture = user.services[service].picture;
        } else if (serviceObj.profile_image_url_https) {
          additionals.profile.picture = user.services[service].dprofile_image_url_https;
        } else if (serviceObj.profile_picture) {
          additionals.profile.picture = user.services[service].profile_picture;
        }
        // Correctly map Instagram profile data to Meteor user / Accounts
        if (userServices.instagram) {
          user.username = serviceObj.username;
          user.name = serviceObj.full_name;
          additionals.name = serviceObj.full_name;
          additionals.profile.picture = serviceObj.profile_picture;
          additionals.profile.bio = serviceObj.bio;
          additionals.profile.name = serviceObj.full_name;
          additionals.profile.username = serviceObj.username;
        }
      }
    }

    // Automatically verify "localhost" email addresses
    let emailIsVerified = false;
    if (user.emails[0] && user.emails[0].address.indexOf("localhost") > -1) {
      user.emails[0].verified = true;
      emailIsVerified = true;
    }

    // clone before adding roles
    const account = Object.assign({ shopId }, user, additionals);
    account.userId = user._id;
    Collections.Accounts.insert(account);

    const insertedAccount = Collections.Accounts.findOne({ userId: user._id });
    Promise.await(appEvents.emit("afterAccountCreate", {
      account: insertedAccount,
      createdBy: user._id
    }));

    // send a welcome email to new users,
    // but skip the first default admin user and anonymous users
    // (default admins already get a verification email)
    if (shopId && !emailIsVerified && user.emails[0]) {
      const tokenObj = generateVerificationTokenObject({ address: user.emails[0].address });

      sendWelcomeEmail(shopId, user._id, tokenObj.token);

      _.set(user, "services.email.verificationTokens", [tokenObj]);
    }

    // assign default user roles
    user.roles = roles;

    return user;
  });

  /**
   * Accounts.onLogin event
   * @param {Object} options - user account creation options
   */
  Accounts.onLogin((options) => {
    // The first time an "anonymous" user logs in for real, remove their "anonymous" role.
    // Anonymous users don't have profile access or ability to see order history, etc.
    if (options.type !== "anonymous" && options.type !== "resume") {
      const userId = options.user._id;

      Meteor.users.update({ _id: userId }, {
        $pullAll: {
          [`roles.${Reaction.getShopId()}`]: ["anonymous"]
        }
      });

      Logger.debug(`removed anonymous role from user: ${userId}`);
    }
  });
});
