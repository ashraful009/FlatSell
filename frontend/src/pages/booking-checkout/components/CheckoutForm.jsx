import React from 'react';

const CheckoutForm = ({
  hasFields,
  sectionOrder,
  groupedFields,
  sectionIcons,
  formData,
  fileData,
  errors,
  handleChange,
  handleFileChange,
  refundAccepted,
  setRefundAccepted,
  refundWindowDays,
  retentionPct,
  submitting,
  bookingMoney,
  handleSubmit,
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Dynamic Form Sections ────────────────────────────────── */}
      {hasFields ? (
        sectionOrder.map((sectionName) => {
          const sectionFields = groupedFields[sectionName];
          if (!sectionFields?.length) return null;

          return (
            <div key={sectionName} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-blue-100">
                <span className="text-xl">{sectionIcons[sectionName]}</span>
                <h3 className="text-gray-900 font-semibold text-sm">{sectionName}</h3>
                <span className="text-xs text-gray-600 ml-auto">
                  {sectionFields.length} field{sectionFields.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sectionFields.map(({ key, label, type, options }) => (
                  <div key={key} className={type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="form-label">
                      {label} <span className="text-red-600">*</span>
                    </label>

                    {type === 'textarea' ? (
                      <textarea
                        rows={2}
                        value={formData[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={`form-input resize-none ${errors[key] ? 'border-red-500/50' : ''}`}
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    ) : type === 'select' ? (
                      <select
                        value={formData[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={`form-input ${errors[key] ? 'border-red-500/50' : ''}`}
                      >
                        <option value="">Select {label}</option>
                        {options?.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : type === 'file' ? (
                      <div>
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed
                          cursor-pointer transition-all duration-200
                          ${fileData[key]
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : errors[key]
                              ? 'border-red-500/40 hover:border-red-500/60'
                              : 'border-blue-200 hover:border-primary-500/40 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-lg">{fileData[key] ? '✅' : '📎'}</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm truncate ${fileData[key] ? 'text-emerald-300' : 'text-gray-500'}`}>
                              {fileData[key]?.name || `Upload ${label}`}
                            </p>
                            <p className="text-xs text-gray-600">JPG, PNG, PDF · Max 5MB</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(key, e.target.files[0])}
                          />
                        </label>
                      </div>
                    ) : (
                      <input
                        type={type}
                        value={formData[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={`form-input ${errors[key] ? 'border-red-500/50' : ''}`}
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    )}

                    {errors[key] && (
                      <p className="text-red-600 text-xs mt-1">{errors[key]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="glass-card p-6 text-center">
          <span className="text-3xl block mb-2">📋</span>
          <p className="text-gray-500 text-sm">
            No additional information required. You can proceed directly to payment.
          </p>
        </div>
      )}

      {/* ── Refund Policy (Policy 2) + Acknowledgment ───────────── */}
      <div className="glass-card p-5 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">↩️</span>
          <h3 className="text-gray-900 font-semibold text-sm">Refund Policy</h3>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          You may request a refund within{' '}
          <strong className="text-amber-300">{refundWindowDays} days</strong> of booking.{' '}
          <strong className="text-amber-300">{retentionPct}%</strong> of your paid amount
          will be retained (non-refundable). After this period,{' '}
          <strong className="text-amber-300">no refund will be accepted</strong>. Refunds are
          paid from the vendor&apos;s account.
        </p>
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={refundAccepted}
            onChange={(e) => setRefundAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary-500 cursor-pointer"
          />
          <span className="text-sm text-gray-600">
            I have read and acknowledge the refund policy above.
          </span>
        </label>
      </div>

      {/* ── Submit Button ────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={submitting || !refundAccepted}
        className="btn-primary w-full py-4 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          <>💳 Proceed to Payment — ৳{bookingMoney.toLocaleString()}</>
        )}
      </button>
    </form>
  );
};

export default CheckoutForm;
