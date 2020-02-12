import { createRequire } from "module";
import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import config from "./config.js";
import buildContext from "./util/buildContext.js";
import getErrorFormatter from "./util/getErrorFormatter.js";
import createDataLoaders from "./util/createDataLoaders.js";

const require = createRequire(import.meta.url);
const { gql } = require("apollo-server");
const { ApolloServer } = require("apollo-server-express");
const { buildFederatedSchema } = require("@apollo/federation");

const DEFAULT_GRAPHQL_PATH = "/graphql";

/**
 * @name createApolloServer
 * @method
 * @memberof GraphQL
 * @summary Creates an express app with Apollo Server route
 * @param {Object} options Options
 * @returns {ExpressApp} The express app
 */
export default function createApolloServer(options = {}) {
  const { context: contextFromOptions, expressMiddleware, resolvers } = options;
  const path = options.path || DEFAULT_GRAPHQL_PATH;

  // We support passing in typeDef strings.
  // Already executable schema are not supported with federation.
  const schemas = options.schemas || [];
  const executableSchemas = schemas.filter((td) => typeof td !== "string");
  const typeDefs = schemas.filter((td) => typeof td === "string");

  if (typeDefs.length === 0) {
    throw new Error("No type definitions (schemas) provided for GraphQL");
  }

  if (executableSchemas.length) {
    throw new Error("Executable schemas are not supported.");
  }

  // Create a custom Express server so that we can add our own middleware and HTTP routes
  const app = express();

  // Merge string typeDefs into one
  const mergedTypeDefs = typeDefs.join(" ");

  // Build federated schema from typeDefs and resolvers
  const schema = buildFederatedSchema([{
    typeDefs: gql(mergedTypeDefs),
    resolvers
  }]);

  const apolloServer = new ApolloServer({
    async context({ connection, req }) {
      const context = { ...contextFromOptions };

      // For a GraphQL subscription WebSocket request, there is no `req`
      if (connection) return context;

      // Express middleware should have already set req.user if there is one
      await buildContext(context, req);

      await createDataLoaders(context);

      return context;
    },
    debug: options.debug || false,
    formatError: getErrorFormatter(),
    schema,
    introspection: config.GRAPHQL_INTROSPECTION_ENABLED,
    playground: config.GRAPHQL_PLAYGROUND_ENABLED
  });

  const gqlMiddleware = expressMiddleware.filter((def) => def.route === "graphql" || def.route === "all");

  // GraphQL endpoint, enhanced with JSON body parser
  app.use.apply(app, [
    path,
    // set a higher limit for data transfer, which can help with GraphQL mutations
    // `express` default is 100kb
    // AWS default is 5mb, which we'll use here
    bodyParser.json({ limit: config.BODY_PARSER_SIZE_LIMIT }),
    // Enable `cors` to set HTTP response header: Access-Control-Allow-Origin: *
    // Although the `cors: true` option to `applyMiddleware` below does this already
    // for successful requests, we need it to be set here, before token middleware,
    // so that the header is set on 401 responses, too. Otherwise it breaks our 401
    // refresh handling on the clients.
    cors(),
    ...gqlMiddleware.filter((def) => def.stage === "first").map((def) => def.fn(contextFromOptions)),
    ...gqlMiddleware.filter((def) => def.stage === "before-authenticate").map((def) => def.fn(contextFromOptions)),
    ...gqlMiddleware.filter((def) => def.stage === "authenticate").map((def) => def.fn(contextFromOptions)),
    ...gqlMiddleware.filter((def) => def.stage === "before-response").map((def) => def.fn(contextFromOptions))
  ]);

  // Rewrite url to support legacy graphql routes
  app.all(/\/graphql-\w+/, (req, res) => {
    req.url = path;

    // NOTE: This must use `app.handle(req, res)` instead
    // of `next()` or else all of the middleware attached
    // to `path` above does not run and, for example,
    // `request.user` and `context.user` won't be set.
    app.handle(req, res);
  });

  apolloServer.applyMiddleware({ app, cors: true, path });

  return {
    apolloServer,
    expressApp: app,
    path
  };
}
