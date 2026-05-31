const { runAutoCancelInactiveBookings } = require('./autoCancelInactiveBookings');

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight in-process daily scheduler (no external cron dependency).
//
// On startup it runs the inactivity scan once (after a short delay so the DB
// connection has settled), then re-runs it every 24 hours. This satisfies the
// "scheduled job that runs daily" requirement while keeping deployment simple.
//
// In a multi-instance deployment you would move this to a real cron / a single
// worker; the job itself is idempotent (guards on cancellationReason / warning
// flags) so duplicate runs are safe.
// ─────────────────────────────────────────────────────────────────────────────

const ONE_DAY_MS    = 24 * 60 * 60 * 1000;
const STARTUP_DELAY = 30 * 1000; // 30s after boot

let dailyTimer = null;

const safeRun = async (label, fn) => {
  try {
    await fn();
  } catch (err) {
    console.error(`❌ Scheduled job "${label}" crashed:`, err.message);
  }
};

const startScheduler = () => {
  if (process.env.DISABLE_CRON === 'true') {
    console.log('⏸️  Cron scheduler disabled via DISABLE_CRON=true');
    return;
  }

  // Initial run shortly after boot.
  setTimeout(() => {
    safeRun('auto-cancel-inactive-bookings', runAutoCancelInactiveBookings);
  }, STARTUP_DELAY);

  // Daily thereafter.
  dailyTimer = setInterval(() => {
    safeRun('auto-cancel-inactive-bookings', runAutoCancelInactiveBookings);
  }, ONE_DAY_MS);

  console.log('🗓️  Daily policy scheduler started (auto-cancellation scan).');
};

const stopScheduler = () => {
  if (dailyTimer) clearInterval(dailyTimer);
  dailyTimer = null;
};

module.exports = { startScheduler, stopScheduler };
