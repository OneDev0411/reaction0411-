import Logger from "@reactioncommerce/logger";
import ReactionError from "@reactioncommerce/reaction-error";

/**
 * @name buildContext
 * @method
 * @memberof GraphQL
 * @summary Mutates the provided context object, adding `user`, `userId`, `account`,
 *   `accountId`, `userHasPermission`, and `requestHeaders` properties.
 * @param {Object} context - A context object on which to set additional context properties
 * @param {Object} request - Request object
 * @param {Object} request.headers - Map of headers from the client request
 * @param {String} request.hostname - Hostname derived from Host or X-Forwarded-Host header
 * @param {String} request.protocol - Either http or https
 * @returns {undefined} No return
 */
export default async function buildContext(context, request = {}) {
  // To support mocking the user in integration tests, we respect `context.user` if already set
  if (!context.user) {
    context.user = request.user || null;
  }

  const userId = (context.user && context.user._id) || null;
  context.userId = userId;

  // DEPRECATED
  // Legacy authorization methods will be removed in a future release
  // Use Keto authorization methods instead
  if (userId) {
    if (typeof context.auth.getHasPermissionFunctionForUserLegacy === "function") {
      context.userHasPermissionLegacy = await context.auth.getHasPermissionFunctionForUserLegacy(context);
    } else {
      context.userHasPermissionLegacy = () => false;
    }

    context.validatePermissionsLegacy = async (...args) => {
      const allowed = await context.userHasPermissionLegacy(...args);
      if (!allowed) throw new ReactionError("access-denied", "Access Denied");
    };
  } else {
    context.validatePermissionsLegacy = async () => {
      throw new ReactionError("access-denied", "Access Denied");
    };
    context.userHasPermissionLegacy = () => false;
  }

  // Keto authorization methods
  if (userId) {
    if (typeof context.auth.getHasPermissionFunctionForUser === "function") {
      context.userHasPermission = true; // TODO(pod-auth): temporarily set permissions for new auth service to `true`. remove this once auth service is running.
      // context.userHasPermission = await context.auth.getHasPermissionFunctionForUser(context);
    } else {
      context.userHasPermission = () => true; // TODO(pod-auth): temporarily set permissions for new auth service to `true`. remove this once auth service is running.
      // context.userHasPermission = () => false;
    }

    context.validatePermissions = async (...args) => {
      const allowed = await context.userHasPermission(...args);
      if (!allowed) throw new ReactionError("access-denied", "Access Denied");
    };
  } else {
    context.validatePermissions = async () => {
      throw new ReactionError("access-denied", "Access Denied");
    };
    context.userHasPermission = () => false;
  }

  let account;
  if (userId && typeof context.auth.accountByUserId === "function") {
    account = await context.auth.accountByUserId(context, userId);

    // Create an account the first time a user makes a request
    if (!account) {
      try {
        Logger.debug(`Creating missing account for user ID ${userId}`);
        account = await context.mutations.createAccount({ ...context, isInternalCall: true }, {
          emails: context.user.emails && context.user.emails.map((rec) => ({ ...rec, provides: rec.provides || "default" })),
          name: context.user.name,
          profile: context.user.profile || {},
          userId
        });
      } catch (error) {
        // We might have had a unique index error if account already exists due to timing
        account = await context.auth.accountByUserId(context, userId);
        if (!account) Logger.error(error, "Creating missing account failed");
      }
    }
  }

  context.account = account || null;
  context.accountId = (account && account._id) || null;

  // Make some request headers available to resolvers on context, but remove any
  // with potentially sensitive information in them.
  context.requestHeaders = { ...request.headers };
  delete context.requestHeaders.authorization;
  delete context.requestHeaders.cookie;
  delete context.requestHeaders["meteor-login-token"];

  // Reset isInternalCall in case it has been incorrectly changed
  context.isInternalCall = false;
}
