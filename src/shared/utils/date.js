const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

// Default timezone for users (Thailand)
const DEFAULT_TZ = "Asia/Bangkok";

/**
 * Normalize various date inputs to a MySQL DATE string (YYYY-MM-DD).
 * - If `input` is already a date-only string (YYYY-MM-DD), returns it.
 * - If `input` is an ISO datetime (e.g., produced by toISOString from local midnight),
 *   interpret it in the user's timezone (DEFAULT_TZ) so the stored date matches the
 *   date the user selected in the UI.
 * Returns null if the input is falsy or invalid.
 */
function normalizeToDate(input) {
  if (!input) return null;
  const asString = String(input).trim();
  // Quick match for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;

  // Parse ISO and convert to user's timezone then extract date
  const d = dayjs(asString).utc().tz(DEFAULT_TZ);
  if (!d.isValid()) return null;
  return d.format("YYYY-MM-DD");
}

module.exports = { normalizeToDate };
