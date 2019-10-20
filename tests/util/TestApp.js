import { gql } from "apollo-server";
import { createTestClient } from "apollo-server-testing";
import hashToken from "@reactioncommerce/api-utils/hashToken.js";
import Logger from "@reactioncommerce/logger";
import Random from "@reactioncommerce/random";
import Factory from "/tests/util/factory.js";
import ReactionAPI from "../../src/core/ReactionAPI.js";
import buildContext from "../../src/core/util/buildContext";
import registerPlugins from "../../src/registerPlugins";

class TestApp {
  constructor() {
    try {
      this.reactionNodeApp = new ReactionAPI({
        rootUrl: "https://shop.fake.site/",
        version: "0.0.0-test"
      });
    } catch (error) {
      Logger.error("Failed to initialize a ReactionAPI instance", error);
    }

    this.collections = this.reactionNodeApp.collections;
    this.context = this.reactionNodeApp.context;

    this.mutate = (mutation) => async (variables) => {
      const result = await this.graphClient.mutate({ mutation: gql(mutation), variables });
      if (result.errors) throw result.errors;
      return result.data;
    };

    this.query = (query) => async (variables) => {
      const result = await this.graphClient.query({ query: gql(query), variables });
      if (result.errors) throw result.errors;
      return result.data;
    };
  }

  async createUserAndAccount(user = {}, globalRoles) {
    await this.reactionNodeApp.collections.users.insertOne({
      ...user,
      roles: {
        ...(user.roles || {}),
        __global_roles__: globalRoles || [] // eslint-disable-line camelcase
      },
      services: {
        resume: {
          loginTokens: []
        }
      }
    });

    await this.reactionNodeApp.collections.Accounts.insertOne({ ...user, userId: user._id });
  }

  async setLoggedInUser(user = {}) {
    if (!user._id) throw new Error("setLoggedInUser: user must have _id property set");

    const { users } = this.reactionNodeApp.collections;

    const loginToken = Random.id();
    const hashedToken = hashToken(loginToken);

    const existing = await users.findOne({ _id: user._id });
    if (!existing) {
      await this.createUserAndAccount(user);
    }

    // Set the hashed login token on the users document
    await users.updateOne({ _id: user._id }, {
      $push: {
        "services.resume.loginTokens": {
          hashedToken,
          when: new Date()
        }
      }
    });

    this.userId = user._id;

    const dbUser = await users.findOne({ _id: user._id });
    this.reactionNodeApp.context.user = dbUser;
  }

  async clearLoggedInUser() {
    this.userId = null;
    this.reactionNodeApp.context.user = null;
  }

  async publishProducts(productIds) {
    const requestContext = { ...this.reactionNodeApp.context };
    await buildContext(requestContext);
    requestContext.userHasPermission = () => true;
    return this.reactionNodeApp.context.mutations.publishProducts(requestContext, productIds);
  }

  async insertPrimaryShop(shopData) {
    // Need shop domains and ROOT_URL set in order for `shopId` to be correctly set on GraphQL context
    const domain = "shop.fake.site";
    process.env.ROOT_URL = `https://${domain}/`;

    const mockShop = Factory.Shop.makeOne({
      currencies: {
        USD: {
          enabled: true,
          format: "%s%v",
          symbol: "$"
        }
      },
      currency: "USD",
      name: "Primary Shop",
      ...shopData,
      shopType: "primary",
      domains: [domain]
    });

    const result = await this.reactionNodeApp.collections.Shops.insertOne(mockShop);

    return result.insertedId;
  }

  // Keep this in sync with the real `registerPlugin` in `ReactionAPI`
  async registerPlugin(plugin) {
    return this.reactionNodeApp.registerPlugin(plugin);
  }

  async runServiceStartup() {
    return this.reactionNodeApp.runServiceStartup();
  }

  async start() {
    try {
      await registerPlugins(this.reactionNodeApp);
    } catch (error) {
      Logger.error(error, "Error registering plugins in TestApp");
      throw error;
    }

    // These globals are made available by @shelf/jest-mongodb package
    const dbName = global.__MONGO_DB_NAME__;
    let mongoUrl = global.__MONGO_URI__;

    // Change the default DB name to a unique one so that each test file is sandboxed
    mongoUrl = mongoUrl.replace(dbName, Random.id());

    // We intentionally do not pass `port` option, which prevents
    // it from starting the actual server. We will use
    // `createTestClient` below instead of an actual server.
    try {
      await this.reactionNodeApp.start({ mongoUrl, shouldInitReplicaSet: true });
    } catch (error) {
      Logger.error(error, "Error starting app in TestApp");
      throw error;
    }

    this.graphClient = createTestClient(this.reactionNodeApp.apolloServer);
  }

  async stop() {
    await this.reactionNodeApp.stop();
  }
}

export default TestApp;
