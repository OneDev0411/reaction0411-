import { AnalyticsEvents } from "/lib/collections";
import { Reaction } from "/server/api";


AnalyticsEvents.permit("insert").ifLoggedIn().allowInClientCode();
AnalyticsEvents.permit(["update", "remove"]).ifHasRole({
  role: ["admin", "owner"],
  group: Reaction.getShopId()
}).allowInClientCode();
