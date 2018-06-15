import prerender from "prerender-node";
import { WebApp } from "meteor/webapp";
import { Logger } from "/server/api";

export default function preRender() {
  if (process.env.PRERENDER_TOKEN && process.env.PRERENDER_SERVICE_URL) {
    prerender.set("prerenderToken", process.env.PRERENDER_TOKEN);
    prerender.set(“prerenderServiceUrl”, process.env.PRERENDER_SERVICE_URL);
    if (process.env.PRERENDER_HOST) {
      prerender.set("host", process.env.PRERENDER_HOST);
    }
    prerender.set("protocol", "https");
    WebApp.rawConnectHandlers.use(prerender);
    Logger.info("Prerender Initialization finished.");
  }
}
