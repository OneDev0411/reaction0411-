import { addWorker, cancelJobs, getJob, scheduleJob } from "./api";
import { registerPluginHandler } from "./registration";
import shutdown from "./shutdown";
import startup from "./startup";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Job Queue",
    name: "reaction-job-queue",
    functionsByType: {
      registerPluginHandler: [registerPluginHandler],
      shutdown: [shutdown],
      startup: [startup]
    },
    collections: {
      Jobs: {
        name: "Jobs",
        indexes: [
          [{ status: 1 }],
          [{ type: 1, status: 1 }],
          [{ priority: 1, retryUntil: 1, after: 1 }]
        ]
      }
    },
    contextAdditions: {
      backgroundJobs: {
        addWorker,
        cancelJobs,
        getJob,
        scheduleJob
      }
    }
  });
}
