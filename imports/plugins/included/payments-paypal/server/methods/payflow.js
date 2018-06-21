import { Meteor } from "meteor/meteor";
import * as PayflowproMethods from "./payflowproMethods";

/**
 * @namespace Payment/PayflowPro/Methods
 */

Meteor.methods({
  "payflowpro/payment/submit": PayflowproMethods.paymentSubmit,
  "payflowpro/payment/capture": PayflowproMethods.paymentCapture,
  "payflowpro/refund/create": PayflowproMethods.createRefund,
  "payflowpro/refund/list": PayflowproMethods.listRefunds,
  "payflowpro/settings": PayflowproMethods.getSettings
});
