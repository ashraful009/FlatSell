import React from 'react';

const CheckoutSidebarSummary = ({
  totalPrice,
  percentage,
  bookingMoney,
  dueAmount,
}) => {
  return (
    <div className="glass-card p-5 sticky top-20 space-y-4">
      <h3 className="text-gray-900 font-bold text-sm border-b border-blue-100 pb-3">
        💰 Payment Summary
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Price</span>
          <span className="text-gray-900 font-semibold">৳{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Booking Money ({percentage}%)</span>
          <span className="text-emerald-600 font-bold">৳{bookingMoney.toLocaleString()}</span>
        </div>
        <div className="border-t border-blue-100 pt-3 flex justify-between text-sm">
          <span className="text-gray-500">Due After Booking</span>
          <span className="text-amber-600 font-semibold">৳{dueAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl">
        <p className="text-primary-600 text-xs leading-relaxed">
          💡 You will pay <strong>৳{bookingMoney.toLocaleString()}</strong> now as booking money.
          The remaining <strong>৳{dueAmount.toLocaleString()}</strong> can be paid later from your dashboard.
        </p>
      </div>

      {/* Security badges */}
      <div className="flex flex-wrap gap-2 pt-2">
        {['🔒 Secure', '💳 Stripe', '🛡️ Protected'].map((badge) => (
          <span key={badge} className="text-xs px-2.5 py-1 bg-slate-50 border border-blue-100 rounded-lg text-gray-500">
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
};

export default CheckoutSidebarSummary;
