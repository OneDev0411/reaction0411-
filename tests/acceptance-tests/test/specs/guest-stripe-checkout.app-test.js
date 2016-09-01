"use strict";
const yaml = require("js-yaml");
const fs   = require("fs");
const expect = require("chai").expect;
const shopUser = require("../../lib/user-shop-actions.js");
const userDo = require("../../lib/basic-user-actions.js");

beforeEach(function () {
  const browserConfig = yaml.safeLoad(fs.readFileSync("./tests/acceptance-tests/config/settings.yml", "utf8"));
  const baseUrl = browserConfig.base_url.toString();
  browser.url(baseUrl);
});


describe("stripe guest checkout test", function () {
  const eleMap = yaml.safeLoad(fs.readFileSync("./tests/acceptance-tests/elements/element-map.yml", "utf8"));
  it("verify guest can checkout with stripe", function () {
    browser.pause("5000");
    userDo.UserActions.refreshShop();
    browser.click(eleMap.product);
    browser.pause("5000");
    browser.click(eleMap.red_option);
    browser.pause("2000");
    browser.click(eleMap.add_to_cart);
    browser.pause("2000");
    browser.click(eleMap.checkout_btn);
    browser.pause("5000");
    browser.click(eleMap.continue_as_guest);
    browser.pause("3000");
    shopUser.userAddress();
    // free shipping option
    browser.click(eleMap.free_shipping);
    browser.pause("3000");
    browser.click(eleMap.stripe);
    browser.pause("6000");
    shopUser.stripePaymentInfo();
    browser.pause("5000");
    browser.click(eleMap.stripe_complete_order_btn);
    browser.pause("9000");
    expect(browser.getText("#order-status")).to.equal("Your order is now submitted.");
  });
});
