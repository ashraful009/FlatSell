import React from 'react';

const BookingLimitUsage = ({ limit }) => {
  if (!limit) return null;

  return (
    <div className="text-right">
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-blue-100">
        <span className="text-sm text-gray-600">Active bookings</span>
        <span
          className={`text-sm font-bold ${
            limit.totalActive >= limit.totalLimit ? 'text-red-600' : 'text-primary-600'
          }`}
        >
          {limit.totalActive} of {limit.totalLimit} used
        </span>
      </div>
      {limit.totalActive >= limit.totalLimit && (
        <p className="text-xs text-amber-600 mt-1">
          Limit reached.{' '}
          <a
            href="mailto:icsteamservice@gmail.com?subject=Booking%20Limit%20Override%20Request"
            className="underline"
          >
            Contact Super Admin
          </a>{' '}
          to book more.
        </p>
      )}
    </div>
  );
};

export default BookingLimitUsage;
