import React from 'react';

const CheckoutHeader = ({ navigate }) => {
  return (
    <div className="mb-8">
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 hover:text-gray-900 text-sm mb-4 flex items-center gap-1 transition-colors"
      >
        ← Back to Property
      </button>
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Booking Checkout</h1>
      <p className="text-gray-500 text-sm mt-1">
        Complete the form below to proceed with your booking payment
      </p>
    </div>
  );
};

export default CheckoutHeader;
