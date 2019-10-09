import { get } from "lodash";
import resolveShopFromShopId from "@reactioncommerce/api-utils/graphql/resolveShopFromShopId.js";
import { encodeAccountOpaqueId } from "@reactioncommerce/reaction-graphql-xforms/account";
import getCurrencyDefinitionByCode from "@reactioncommerce/api-utils/getCurrencyDefinitionByCode.js";
import addressBook from "./addressBook.js";

export default {
  _id: (account) => encodeAccountOpaqueId(account._id),
  addressBook,
  currency: (account) => getCurrencyDefinitionByCode(account.profile && account.profile.currency),
  emailRecords: (account) => account.emails,
  firstName: (account) => account.profile.firstName,
  lastName: (account) => account.profile.lastName,
  language: (account) => account.profile.language,
  name: (account) => account.profile.name,
  preferences: (account) => get(account, "profile.preferences"),
  primaryEmailAddress: (account) => {
    const primaryRecord = (account.emails || []).find((record) => record.provides === "default");
    return (primaryRecord && primaryRecord.address) || null;
  },
  shop: resolveShopFromShopId
};
