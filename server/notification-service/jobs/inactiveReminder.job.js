/**
 * Inactive User Reminder Job
 *
 * Schedule: Every hour (cron: "0 * * * *")
 *
 * Logic:
 *   1. Find all users whose last_active_at is older than 3 days
 *   2. For each user, check if a reminder was already sent in the last 24 hours
 *   3. If not, send an SMS reminder and log the notification
 *
 * NOTE: In production, this cron job will be replaced by Google Cloud Scheduler.
 *   Cloud Scheduler will send an authenticated HTTP POST to a dedicated endpoint
 *   (e.g. POST /notify/inactivity-check) on a defined schedule.
 *   This makes the trigger externally managed, independently retryable, and
 *   observable via Google Cloud Console without needing the cron inside the container.
 */

const cron = require("node-cron");
const prisma = require("../../shared/prisma");
const { sendReminderSms } = require("../../shared/sms");
const logger = require("../../shared/logger");

const INACTIVITY_DAYS = 3;
const NOTIFICATION_COOLDOWN_HOURS = 24;
const REMINDER_MESSAGE =
  "Hello! You haven't visited Lyfshilp in a while. " +
  "Log in to check the latest crop market trends and advisory insights.";

async function runInactiveReminder() {
  logger.info("[NotificationJob] Starting inactive user reminder check");

  try {
    const inactivityCutoff = new Date();
    inactivityCutoff.setDate(inactivityCutoff.getDate() - INACTIVITY_DAYS);

    const cooldownCutoff = new Date();
    cooldownCutoff.setHours(cooldownCutoff.getHours() - NOTIFICATION_COOLDOWN_HOURS);

    // Find users who have not been active for more than 3 days
    const inactiveUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        lastActiveAt: { lt: inactivityCutoff },
      },
      select: {
        id: true,
        phone: true,
        notifications: {
          where: {
            type: "inactivity_reminder",
            sentAt: { gte: cooldownCutoff },
          },
          take: 1,
        },
      },
    });

    logger.info(`[NotificationJob] Found ${inactiveUsers.length} inactive users`);

    let sent = 0;
    let skipped = 0;

    for (const user of inactiveUsers) {
      // Skip if a reminder was already sent within the cooldown window
      if (user.notifications.length > 0) {
        skipped++;
        continue;
      }

      try {
        const now = new Date();

        await sendReminderSms(user.phone, REMINDER_MESSAGE);

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "inactivity_reminder",
            message: REMINDER_MESSAGE,
            sentAt: now,
          },
        });

        sent++;
        logger.info(`[NotificationJob] Reminder sent to user ${user.id}`);
      } catch (err) {
        logger.error(`[NotificationJob] Failed to notify user ${user.id}`, {
          error: err.message,
        });
      }
    }

    logger.info(`[NotificationJob] Complete — sent: ${sent}, skipped: ${skipped}`);
  } catch (err) {
    logger.error("[NotificationJob] Job failed", { error: err.message });
  }
}

/**
 * Register and start the cron job.
 * Called during server startup from api-gateway/src/index.js
 */
function startInactiveReminderJob() {
  // Runs every hour at minute 0
  cron.schedule("0 * * * *", runInactiveReminder, {
    timezone: "Asia/Kolkata",
  });

  logger.info("[NotificationJob] Inactive reminder job scheduled (every hour)");
}

module.exports = { startInactiveReminderJob, runInactiveReminder };
