import { useEffect } from 'react';

// ── KYC field metadata — mirrors the booking checkout form (BookingCheckoutPage) ──
const KYC_FIELDS = {
  // Personal
  fullName:          { label: 'Full Name (NID/Passport)', section: 'Personal Information' },
  fatherMotherName:  { label: "Father's / Mother's Name",  section: 'Personal Information' },
  spouseName:        { label: 'Spouse Name',               section: 'Personal Information' },
  dob:               { label: 'Date of Birth',             section: 'Personal Information' },
  nidPassportNumber: { label: 'NID / Passport Number',     section: 'Personal Information' },
  profession:        { label: 'Profession / Company',      section: 'Personal Information' },
  nationality:       { label: 'Nationality',               section: 'Personal Information' },
  // Contact
  mobile:            { label: 'Mobile Number',             section: 'Contact Information' },
  email:             { label: 'Email Address',             section: 'Contact Information' },
  presentAddress:    { label: 'Present Address',           section: 'Contact Information' },
  permanentAddress:  { label: 'Permanent Address',         section: 'Contact Information' },
  // Financial
  tinCertificate:    { label: 'TIN Certificate Number',    section: 'Financial Information' },
  paymentSource:     { label: 'Payment Source',            section: 'Financial Information' },
  bankDetails:       { label: 'Bank Details',              section: 'Financial Information' },
  // Property
  projectNameLocation:   { label: 'Project Name / Location',  section: 'Property Details' },
  sizeFloor:             { label: 'Size / Floor',             section: 'Property Details' },
  unitNumber:            { label: 'Unit Number',              section: 'Property Details' },
  carParking:            { label: 'Car Parking Preference',   section: 'Property Details' },
  installmentPreference: { label: 'Installment Preference',   section: 'Property Details' },
  // Nominee
  nomineeName:       { label: 'Nominee Name',              section: 'Nominee Information' },
  nomineeRelation:   { label: 'Relation with Nominee',     section: 'Nominee Information' },
  nomineeNid:        { label: 'Nominee NID Number',        section: 'Nominee Information' },
};

const DOC_LABELS = {
  customerPhoto:  'Customer Photo',
  nidCopy:        'NID Copy',
  tinCopy:        'TIN Certificate Copy',
  nomineePhoto:   'Nominee Photo',
  nomineeNidCopy: 'Nominee NID Copy',
};

const SECTION_ORDER = [
  'Personal Information',
  'Contact Information',
  'Financial Information',
  'Property Details',
  'Nominee Information',
];

const SECTION_ICONS = {
  'Personal Information':  '👤',
  'Contact Information':   '📞',
  'Financial Information': '💳',
  'Property Details':      '🏠',
  'Nominee Information':   '👥',
};

const STATUS_STYLES = {
  pending:   'bg-amber-500/15   text-amber-600   border-amber-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  rejected:  'bg-red-500/15     text-red-600     border-red-500/30',
  cancelled: 'bg-gray-500/15    text-gray-500    border-gray-500/30', 
};

const PAYMENT_LABELS = {
  unpaid:       'Unpaid',
  booking_paid: 'Booking Paid',
  fully_paid:   'Fully Paid',
};

const prettify = (key) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const fmtDate = (d) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

// A stored document may be a plain filename (legacy), an http(s)/data URL, or an
// object { name, type, url }. Normalize all three to { name, url }.
const normalizeDoc = (val) => {
  if (val && typeof val === 'object') {
    return { name: val.name || '', url: val.url || val.data || '' };
  }
  if (typeof val === 'string') {
    if (/^data:|^https?:\/\//i.test(val)) return { name: '', url: val };
    return { name: val, url: '' }; // legacy: only a filename was stored
  }
  return { name: '', url: '' };
};

const isImageDoc = ({ url, name }) =>
  /^data:image\//i.test(url) ||
  /\.(png|jpe?g|gif|webp|bmp|jfif|svg)(\?|$)/i.test(url) ||
  /\.(png|jpe?g|gif|webp|bmp|jfif|svg)$/i.test(name);

const Row = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2
                  border-b border-slate-100 last:border-b-0">
    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium sm:w-44 sm:shrink-0">
      {label}
    </p>
    <p className="text-sm text-gray-800 break-words whitespace-pre-wrap min-w-0 flex-1">
      {value || <span className="text-gray-400">—</span>}
    </p>
  </div>
);

/**
 * Popup showing the full details a customer supplied while booking a unit.
 * `booking` is a single populated booking object; `onClose` dismisses the modal.
 */
const BookingDetailModal = ({ booking, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!booking) return null;

  const b   = booking;
  const kyc = b.kycData || {};
  const docs = b.documents || {};

  const propertyTitle = b.propertyId?.title || 'Property';
  const unitNumber    = b.unitId?.unitNumber;
  const unitFloor     = b.unitId?.floor;

  // Group KYC entries by section, keeping only filled values.
  const grouped = {};
  Object.entries(kyc).forEach(([key, val]) => {
    if (val == null || val === '') return;
    const meta = KYC_FIELDS[key];
    const section = meta?.section || 'Other Details';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push({ label: meta?.label || prettify(key), value: String(val) });
  });
  const sectionsToRender = [...SECTION_ORDER, 'Other Details'].filter((s) => grouped[s]?.length);
  const hasKyc = sectionsToRender.length > 0;

  const docEntries = Object.entries(docs).filter(([, v]) => v);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center
                     text-gray-400 hover:text-gray-900 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6 pr-8">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-900">{propertyTitle}</h2>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border capitalize
              ${STATUS_STYLES[b.status] || STATUS_STYLES.pending}`}>
              {b.status || 'pending'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Unit: {unitNumber || 'N/A'}{unitFloor != null && ` · Floor ${unitFloor}`}
          </p>
        </div>

        {/* Account holder (the logged-in user who booked) */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-2 flex items-center gap-1.5">
            <span>🔑</span> Account Holder
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70">
            {b.customerId?.avatar ? (
              <img src={b.customerId.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-purple-500/15 text-purple-600 flex items-center
                              justify-center font-bold">
                {(b.customerId?.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{b.customerId?.name || 'Unknown'}</p>
              <p className="text-xs text-gray-500 truncate">{b.customerId?.email || 'N/A'}</p>
              {b.customerId?.phone && <p className="text-xs text-gray-500">{b.customerId.phone}</p>}
            </div>
          </div>
        </div>

        {/* KYC / booking-form details */}
        {hasKyc ? (
          sectionsToRender.map((section) => (
            <div key={section} className="mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1 flex items-center gap-1.5">
                <span>{SECTION_ICONS[section] || '📄'}</span> {section}
              </h3>
              <div>
                {grouped[section].map((row, i) => (
                  <Row key={i} label={row.label} value={row.value} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="mb-5 p-4 rounded-xl bg-slate-50/70 text-center">
            <p className="text-sm text-gray-500">
              No additional form details were submitted for this booking.
            </p>
          </div>
        )}

        {/* Documents */}
        {docEntries.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1 flex items-center gap-1.5">
              <span>📎</span> Uploaded Documents
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {docEntries.map(([key, raw]) => {
                const doc = normalizeDoc(raw);
                const label = DOC_LABELS[key] || prettify(key);
                return (
                  <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/70 overflow-hidden">
                    {isImageDoc(doc) ? (
                      <a href={doc.url} target="_blank" rel="noreferrer" className="block group">
                        <img
                          src={doc.url}
                          alt={label}
                          className="w-full h-32 object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ) : doc.url ? (
                      <a href={doc.url} target="_blank" rel="noreferrer"
                         className="flex h-32 flex-col items-center justify-center gap-1 text-purple-600 hover:bg-slate-100 transition-colors">
                        <span className="text-3xl">📄</span>
                        <span className="text-xs font-medium">View ↗</span>
                      </a>
                    ) : (
                      <div className="flex h-32 flex-col items-center justify-center gap-1 px-2 text-center">
                        <span className="text-3xl opacity-40">🖼️</span>
                        <span className="text-[11px] text-gray-400">Preview unavailable</span>
                      </div>
                    )}
                    <div className="px-2.5 py-2 border-t border-slate-100">
                      <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
                      {doc.name && <p className="text-[11px] text-gray-400 truncate">{doc.name}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer message */}
        {b.message && (
          <div className="mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1 flex items-center gap-1.5">
              <span>📝</span> Message
            </h3>
            <p className="text-sm text-gray-700 italic p-3 rounded-xl bg-slate-50/70">
              &ldquo;{b.message}&rdquo;
            </p>
          </div>
        )}

        {/* Booking meta */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1 flex items-center gap-1.5">
            <span>📅</span> Booking Details
          </h3>
          <div>
            <Row label="Booking Date" value={fmtDate(b.createdAt)} />
            <Row label="Payment Status" value={PAYMENT_LABELS[b.paymentStatus] || b.paymentStatus} />
            {b.totalPrice != null && (
              <Row label="Total Price" value={`৳ ${Number(b.totalPrice).toLocaleString()}`} />
            )}
            {b.bookingAmount != null && (
              <Row label="Amount Paid" value={`৳ ${Number(b.bookingAmount).toLocaleString()}`} />
            )}
            {b.installmentPlan?.active && (
              <Row label="Installment Plan"
                   value={`${b.installmentPlan.totalCount} installments`} />
            )}
            <Row label="Booking ID" value={b._id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
