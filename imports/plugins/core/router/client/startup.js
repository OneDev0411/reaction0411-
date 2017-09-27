import { loadRegisteredComponents } from "@reactioncommerce/reaction-components";
import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import { Accounts } from "meteor/accounts-base";
import { Shops } from "/lib/collections";
import { initBrowserRouter } from "./browserRouter";
import { Router } from "../lib";

Meteor.startup(function () {
  loadRegisteredComponents();

  // Subscribe to router required publications
  // Note: Although these are subscribed to by the subscription mamager in "/modules/client/core/subscriptions",
  // using the subscriptions manager sometimes causes issues when signing in/out where you may seee a grey screen
  // or missing shop data throughout the app.
  // TODO: Revisit subscriptions manager usage and waiting for shops to exist client side before rendering.
  const primaryShopSub = Meteor.subscribe("PrimaryShop");
  const merchantShopSub = Meteor.subscribe("MerchantShops");
  const packageSub = Meteor.subscribe("Packages");

  Tracker.autorun(function () {
    // initialize client routing
    if (primaryShopSub.ready() && merchantShopSub.ready() && packageSub.ready()) {
      const shops = Shops.find({}).fetch();
      //  initBrowserRouter calls Router.initPackageRoutes which calls shopSub.ready which is reactive,
      //  So we have to call initBrowserRouter in a non reactive context.
      //  Otherwise initBrowserRouter is called twice each time a subscription becomes "ready"
      Tracker.nonreactive(()=> {
        // Make sure we have shops before we try to make routes for them
        if (Array.isArray(shops) && shops.length)  {
          initBrowserRouter();
        }
      });
    }
  });

  //
  // we need to sometimes force
  // router reload on login to get
  // the entire layout to rerender
  // we only do this when the routes table
  // has already been generated (existing user)
  //
  Accounts.onLogin(() => {
    const shops = Shops.find({}).fetch();

    if (Meteor.loggingIn() === false && Router._routes.length > 0) {
      if (Array.isArray(shops) && shops.length)  {
        initBrowserRouter();
      }
    }
  });
});
