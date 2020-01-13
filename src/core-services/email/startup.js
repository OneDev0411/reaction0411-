import processEmailJobs from "./util/processEmailJobs.js";

/**
 * @summary Called on startup
 * @param {Object} context Startup context
 * @param {Object} context.collections Map of MongoDB collections
 * @returns {undefined}
 */
export default function emailStartup(context) {
  processEmailJobs(context);
}

