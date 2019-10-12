import { createRequire } from "module";
import ConnectionCursor from "./ConnectionCursor.js";
import ConnectionLimitInt from "./ConnectionLimitInt.js";
import Currency from "./Currency.js";
import Money from "./Money.js";

const require = createRequire(import.meta.url); // eslint-disable-line
const { GraphQLDate, GraphQLDateTime } = require("graphql-iso-date");

export default {
  ConnectionCursor,
  ConnectionLimitInt,
  Currency,
  Date: GraphQLDate,
  DateTime: GraphQLDateTime,
  Money,
  Mutation: {
    echo: (_, { str }) => `${str}`
  },
  Query: {
    ping: () => "pong"
  },
  Subscription: {
    tick: {
      subscribe: (_, __, context) => {
        let tickValue = 0;
        let intervalId = setInterval(() => {
          tickValue += 1;
          context.pubSub.publish("tick", { tick: tickValue });
          if (tickValue === 10) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }, 1000);

        return context.pubSub.asyncIterator("tick");
      }
    }
  }
};

/**
 * Arguments passed by the client for a query
 * @memberof GraphQL
 * @typedef {Object} ConnectionArgs - an object of all arguments that were sent by the client
 * @property {String} args.after - Connection argument
 * @property {String} args.before - Connection argument
 * @property {Number} args.first - Connection argument
 * @property {Number} args.last - Connection argument
 * @property {Number} args.sortBy - Connection argument. Check schema for allowed values.
 * @property {Number} args.sortOrder - Connection argument
 */
