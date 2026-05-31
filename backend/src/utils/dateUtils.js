// ─────────────────────────────────────────────────────────────────────────────
// dateUtils — centralised, server-timezone date math for the booking policies.
//
// Every policy date calculation goes through these helpers so the rules behave
// consistently (a single source of truth for "how many months since X" and
// "what is the deadline"). All math uses the server's local clock (`new Date()`),
// satisfying the requirement that date/time be computed in the server timezone.
// ─────────────────────────────────────────────────────────────────────────────

/** Current server time. Wrapped so it can be stubbed in tests if ever needed. */
const now = () => new Date();

/**
 * Whole calendar months elapsed between `from` and `to` (default: now).
 * Counts a month only once its day-of-month boundary is reached, e.g.
 * Jan 15 → Mar 14 = 1 month; Jan 15 → Mar 15 = 2 months.
 *
 * @param {Date|string|number} from
 * @param {Date|string|number} [to]
 * @returns {number} integer months (>= 0)
 */
const monthsBetween = (from, to = now()) => {
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a) || isNaN(b) || b < a) return 0;

  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  // Not a full month yet if we haven't reached the same day-of-month.
  if (b.getDate() < a.getDate()) months -= 1;
  return Math.max(0, months);
};

/** Whole days elapsed between `from` and `to` (default: now). */
const daysBetween = (from, to = now()) => {
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
};

/** `date` + `n` days, as a new Date. */
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/** `date` + `n` months, as a new Date. */
const addMonths = (date, n) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
};

/**
 * True when `bookingDate` is still inside the refund window.
 * @param {Date|string|number} bookingDate
 * @param {number} windowDays
 */
const isWithinRefundWindow = (bookingDate, windowDays) =>
  daysBetween(bookingDate, now()) < windowDays;

module.exports = {
  now,
  monthsBetween,
  daysBetween,
  addDays,
  addMonths,
  isWithinRefundWindow,
};
