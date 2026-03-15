/**
 * SMS Adapter
 *
 * Supports two providers:
 *   - "mock"    → logs to console (development)
 *   - "edumarc" → sends real SMS via Edumarc/Combirds API
 *
 * Configure via: SMS_PROVIDER env variable
 *
 * Edumarc official API spec:
 *   POST https://smsapi.edumarcsms.com/api/v1/sendsms
 *   Headers: { Content-Type: application/json, apikey: <EDUMARC_API_KEY> }
 *   Body:    { number: ["<phone>"], message, senderId, templateId }
 */

const axios = require("axios");
const logger = require("./logger");

const EDUMARC_API_URL = "https://smsapi.edumarcsms.com/api/v1/sendsms";

const OTP_TEMPLATE = (otp) =>
  `Your Agro App OTP for verification is: ${otp}. OTP is confidential, refrain from sharing it with anyone. By Edumarc Technologies`;

/**
 * Core SMS send function — routes to the configured provider.
 * @param {string} phone
 * @param {string} message - Full SMS message body
 * @returns {Promise<void>}
 */
async function sendSms(phone, message) {
  const provider = process.env.SMS_PROVIDER || "mock";

  if (provider === "mock") {
    logger.info("[SMS MOCK]", { phone, message });
    return;
  }

  if (provider === "edumarc") {
    return sendViaEdumarc(phone, message);
  }

  throw new Error(`Unknown SMS_PROVIDER: "${provider}"`);
}

/**
 * Send an OTP SMS using the DLT-registered OTP template.
 * @param {string} phone
 * @param {string} otp - Plaintext OTP
 * @returns {Promise<void>}
 */
async function sendOtpSms(phone, otp) {
  return sendSms(phone, OTP_TEMPLATE(otp));
}

/**
 * Send an arbitrary reminder SMS (used by notification cron job).
 * @param {string} phone
 * @param {string} message - Custom message body
 * @returns {Promise<void>}
 */
async function sendReminderSms(phone, message) {
  return sendSms(phone, message);
}

/**
 * Send SMS via Edumarc/Combirds API.
 *
 * Corrections from original (wrong) implementation:
 *   ✅ URL: https://smsapi.edumarcsms.com/api/v1/sendsms  (not api.edumarc.in)
 *   ✅ apikey sent in HTTP HEADER (not in request body)
 *   ✅ number sent as an ARRAY: ["<phone>"]  (not a plain string)
 *   ✅ body keys: senderId, templateId  (camelCase per API spec)
 *
 * @param {string} phone
 * @param {string} message
 */
async function sendViaEdumarc(phone, message) {
  const { EDUMARC_API_KEY, EDUMARC_SENDER_ID, EDUMARC_TEMPLATE_ID } =
    process.env;

  if (!EDUMARC_API_KEY || !EDUMARC_SENDER_ID || !EDUMARC_TEMPLATE_ID) {
    throw new Error(
      "Edumarc SMS credentials are not configured. " +
        "Set EDUMARC_API_KEY, EDUMARC_SENDER_ID, EDUMARC_TEMPLATE_ID."
    );
  }

  const payload = {
    number: [`91${String(phone)}`],  // ← must be an array with country code
    message,
    senderId: EDUMARC_SENDER_ID,
    templateId: EDUMARC_TEMPLATE_ID,
  };

  try {
    const response = await axios.post(EDUMARC_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        apikey: EDUMARC_API_KEY,  // ← apikey in HEADER, not body
      },
      timeout: 10000,
    });

    logger.info("[SMS] Edumarc response", {
      phone,
      status: response.status,
      data: response.data,
    });
  } catch (err) {
    const detail = err.response?.data || err.message;
    logger.error("[SMS] Edumarc send failed", { phone, detail });
    throw new Error("Failed to send SMS via Edumarc");
  }
}

module.exports = { sendSms, sendOtpSms, sendReminderSms };
