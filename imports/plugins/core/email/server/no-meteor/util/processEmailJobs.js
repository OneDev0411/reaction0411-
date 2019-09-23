import Logger from "@reactioncommerce/logger";
import { Jobs } from "/imports/plugins/included/job-queue/server/no-meteor/jobs";

/**
 * @param {Object} context App context
 * @returns {undefined}
 */
export default function processEmailJobs(context) {
  const { appEvents, collections } = context;
  const { Emails } = collections;

  /**
   * @name sendEmailCompleted
   * @summary Callback for when an email has successfully been sent.
   *  Updates email status in DB, logs a debug message, and marks job as done.
   * @param {Object} job The job that completed
   * @param {String} message A message to log
   * @returns {undefined} undefined
   */
  async function sendEmailCompleted(job, message) {
    const jobId = job._doc._id;

    await Emails.updateOne({ jobId }, {
      $set: {
        status: "completed"
      }
    });

    Logger.debug(message);

    return job.done();
  }

  /**
   * @name sendEmailFailed
   * @summary Callback for when an email delivery attempt has failed.
   *  Updates email status in DB, logs an error message, and marks job as failed.
   * @param {Object} job The job that failed
   * @param {String} message A message to log
   * @returns {undefined} undefined
   */
  async function sendEmailFailed(job, message) {
    const jobId = job._doc._id;

    await Emails.updateOne({ jobId }, {
      $set: {
        status: "failed"
      }
    });

    Logger.error(message);

    return job.fail(message);
  }

  /**
   * The `sendEmail` mutation adds jobs to the "sendEmail" queue, and this
   * code processes any remaining jobs every few seconds.
   */
  Jobs.processJobs("sendEmail", {
    pollInterval: 15 * 1000, // poll every 15 seconds
    workTimeout: 2 * 60 * 1000, // fail if it takes longer than 2mins
    payload: 20
  }, async (jobs, callback) => {
    Logger.debug(`sendEmail processJobs function called with ${jobs.length} jobs`);

    const promises = jobs.map(async (job) => {
      const { from, to, subject, html, ...optionalEmailFields } = job.data;

      if (!from || !to || !subject || !html) {
        const msg = "Email job requires an options object with to/from/subject/html.";
        Logger.error(`[Job]: ${msg}`);
        job.fail(msg, { fatal: true });
        return;
      }

      const jobId = job._doc._id;

      await Emails.updateOne({ jobId }, {
        $set: {
          from,
          to,
          subject,
          html,
          status: "processing",
          ...optionalEmailFields
        }
      }, {
        upsert: true
      });

      await appEvents.emit("sendEmail", { job, sendEmailCompleted, sendEmailFailed });
    });

    await Promise.all(promises);

    return callback();
  });
}
