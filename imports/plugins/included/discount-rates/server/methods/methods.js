import { Meteor } from "meteor/meteor";
import { Match, check } from "meteor/check";
import { Reaction } from "/server/api";
import { Discounts } from  "/imports/plugins/core/discounts/lib/collections";
import { DiscountRates as DiscountSchema } from "../../lib/collections/schemas";

// attach discount code specific schema
Discounts.attachSchema(DiscountSchema, { selector: { discountMethod: "rate" } });

//
// make all discount methods available
//
export const methods = {
  /**
   * discounts/addRate
   * @param  {String} modifier update statement
   * @param  {String} docId discount docId
   * @return {String} returns update/insert result
   */
  "discounts/addRate": function (modifier, docId) {
    check(modifier, Object);
    check(docId, Match.OneOf(String, null, undefined));

    // check permissions to add
    if (!Reaction.hasPermission("discount-rates")) {
      throw new Meteor.Error(403, "Access Denied");
    }
    // if no doc, insert
    if (!docId) {
      return Discounts.insert(modifier);
    }
    // else update and return
    return Discounts.update(docId, modifier);
  }
};

// export methods to Meteor
Meteor.methods(methods);
