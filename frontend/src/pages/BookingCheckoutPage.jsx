import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Field metadata — maps field keys to labels, types, and sections
// ─────────────────────────────────────────────────────────────────────────────
const FIELD_META = {
  // Personal
  fullName:          { label: 'Full Name (as per NID/Passport)', type: 'text',   section: 'Personal Information',  icon: '👤' },
  fatherMotherName:  { label: "Father's / Mother's Name",       type: 'text',   section: 'Personal Information',  icon: '👤' },
  spouseName:        { label: 'Spouse Name',                     type: 'text',   section: 'Personal Information',  icon: '👤' },
  dob:               { label: 'Date of Birth',                  type: 'date',   section: 'Personal Information',  icon: '👤' },
  nidPassportNumber: { label: 'NID / Passport Number',          type: 'text',   section: 'Personal Information',  icon: '👤' },
  profession:        { label: 'Profession / Company',           type: 'text',   section: 'Personal Information',  icon: '👤' },
  nationality:       { label: 'Nationality',                    type: 'text',   section: 'Personal Information',  icon: '👤' },
  // Contact
  mobile:            { label: 'Mobile Number',                  type: 'tel',    section: 'Contact Information',   icon: '📞' },
  email:             { label: 'Email Address',                  type: 'email',  section: 'Contact Information',   icon: '📞' },
  presentAddress:    { label: 'Present Address',                type: 'textarea', section: 'Contact Information', icon: '📞' },
  permanentAddress:  { label: 'Permanent Address',              type: 'textarea', section: 'Contact Information', icon: '📞' },
  // Financial
  tinCertificate:    { label: 'TIN Certificate Number',         type: 'text',   section: 'Financial Information', icon: '💳' },
  paymentSource:     { label: 'Payment Source',                 type: 'text',   section: 'Financial Information', icon: '💳' },
  bankDetails:       { label: 'Bank Details',                   type: 'textarea', section: 'Financial Information', icon: '💳' },
  // Property
  projectNameLocation:{ label: 'Project Name / Location',       type: 'text',   section: 'Property Details',     icon: '🏠' },
  sizeFloor:          { label: 'Size / Floor',                   type: 'text',   section: 'Property Details',     icon: '🏠' },
  unitNumber:         { label: 'Unit Number',                    type: 'text',   section: 'Property Details',     icon: '🏠' },
  carParking:         { label: 'Car Parking Preference',         type: 'text',   section: 'Property Details',     icon: '🏠' },
  installmentPreference: { label: 'Installment Preference',     type: 'select', section: 'Property Details',     icon: '🏠', options: ['Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'Lump Sum'] },
  // Nominee
  nomineeName:       { label: 'Nominee Name',                   type: 'text',   section: 'Nominee Information',  icon: '👥' },
  nomineeRelation:   { label: 'Relation with Nominee',          type: 'text',   section: 'Nominee Information',  icon: '👥' },
  nomineeNid:        { label: 'Nominee NID Number',             type: 'text',   section: 'Nominee Information',  icon: '👥' },
  // Documents
  customerPhoto:     { label: 'Customer Photo',                 type: 'file',   section: 'Required Documents',   icon: '📄' },
  nidCopy:           { label: 'NID Copy',                       type: 'file',   section: 'Required Documents',   icon: '📄' },
  tinCopy:           { label: 'TIN Certificate Copy',           type: 'file',   section: 'Required Documents',   icon: '📄' },
  nomineePhoto:      { label: 'Nominee Photo',                  type: 'file',   section: 'Required Documents',   icon: '📄' },
  nomineeNidCopy:    { label: 'Nominee NID Copy',               type: 'file',   section: 'Required Documents',   icon: '📄' },
};

const SECTION_ORDER = [
  'Personal Information',
  'Contact Information',
  'Financial Information',
  'Property Details',
  'Nominee Information',
  'Required Documents',
];

const SECTION_ICONS = {
  'Personal Information':  '👤',
  'Contact Information':   '📞',
  'Financial Information': '💳',
  'Property Details':      '🏠',
  'Nominee Information':   '👥',
  'Required Documents':    '📄',
};

// ─────────────────────────────────────────────────────────────────────────────
// BookingCheckoutPage
// ─────────────────────────────────────────────────────────────────────────────
const BookingCheckoutPage = () => {
  const { unitId } = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [unit, setUnit]         = useState(null);
  const [property, setProperty] = useState(null);
  const [policy, setPolicy]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({});
  const [fileData, setFileData] = useState({});
  const [errors, setErrors]     = useState({});

  // ── Fetch unit, property, and policy ──────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get unit with property
        const unitRes = await axiosInstance.get(`/units/${unitId}`);
        const unitObj = unitRes.data.data.unit;
        setUnit(unitObj);

        // 2. Get full property
        const propRes = await axiosInstance.get(`/properties/${unitObj.propertyId._id || unitObj.propertyId}`);
        const propObj = propRes.data.data.property;
        setProperty(propObj);

        // 3. Get booking policy
        const companyId = propObj.companyId._id || propObj.companyId;
        const category  = propObj.category;
        const policyRes = await axiosInstance.get(`/booking-policies/company/${companyId}/category/${category}`);
        setPolicy(policyRes.data.data.policy);

        // Pre-fill property fields if they're required
        const prefill = {};
        if (propObj) {
          prefill.projectNameLocation = `${propObj.title}, ${propObj.address}, ${propObj.city}`;
          prefill.unitNumber = unitObj.unitNumber || '';
          prefill.sizeFloor  = unitObj.floor ? `Floor ${unitObj.floor}` : '';
        }
        setFormData(prefill);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load checkout data');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [unitId, navigate]);

  // ── Derive required fields ────────────────────────────────────────────
  const requiredFields = policy?.requiredFields || {};
  const activeFieldKeys = Object.keys(requiredFields).filter((k) => requiredFields[k] && FIELD_META[k]);

  // Group by section
  const groupedFields = {};
  activeFieldKeys.forEach((key) => {
    const meta = FIELD_META[key];
    if (!groupedFields[meta.section]) groupedFields[meta.section] = [];
    groupedFields[meta.section].push({ key, ...meta });
  });

  // ── Calculate booking money ───────────────────────────────────────────
  const calculateTotalPrice = () => {
    if (!property) return 0;
    const cat = property.category;
    if (cat === 'apartment' && property.flatTypes?.length > 0 && unit) {
      const match = unit.unitNumber?.match(/\d+([A-Z]+)/i);
      if (match) {
        const colIndex = match[1].charCodeAt(0) - 65;
        const typeIndex = Math.min(colIndex, property.flatTypes.length - 1);
        const ft = property.flatTypes[typeIndex];
        if (ft?.pricePerUnit) return ft.pricePerUnit;
      }
      return property.price || 0;
    }
    if (cat === 'villa') return property.villaDetails?.totalPrice || property.price || 0;
    if (cat === 'land')  return property.landDetails?.totalPrice  || property.price || 0;
    return property.price || 0;
  };

  const totalPrice   = calculateTotalPrice();
  const percentage    = policy?.bookingMoneyPercentage || 20;
  const bookingMoney  = Math.round(totalPrice * (percentage / 100));
  const dueAmount     = totalPrice - bookingMoney;

  // ── Form handlers ─────────────────────────────────────────────────────
  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleFileChange = (key, file) => {
    setFileData((prev) => ({ ...prev, [key]: file }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    activeFieldKeys.forEach((key) => {
      const meta = FIELD_META[key];
      if (meta.type === 'file') {
        if (!fileData[key]) newErrors[key] = `${meta.label} is required`;
      } else {
        if (!formData[key]?.toString().trim()) newErrors[key] = `${meta.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Prepare KYC data (non-file fields)
      const kycData = {};
      activeFieldKeys.forEach((key) => {
        if (FIELD_META[key].type !== 'file') {
          kycData[key] = formData[key];
        }
      });

      // For now, documents will be stored as placeholders — file upload integration
      // would use FormData to upload to Cloudinary. Simplified for the checkout flow.
      const documents = {};
      Object.keys(fileData).forEach((key) => {
        documents[key] = fileData[key]?.name || null;
      });

      const response = await axiosInstance.post('/checkout/create-session', {
        unitId: unit._id,
        message: formData.message || '',
        kycData,
        documents: Object.keys(documents).length > 0 ? documents : null,
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading checkout form...</p>
        </div>
      </div>
    );
  }

  if (!property || !unit) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <p className="text-red-400">Unable to load property data.</p>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">Go Back</button>
        </div>
      </div>
    );
  }

  const hasFields = activeFieldKeys.length > 0;

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      <div className="container-main py-8">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors">
            ← Back to Property
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Booking Checkout</h1>
          <p className="text-gray-400 text-sm mt-1">
            Complete the form below to proceed with your booking payment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Dynamic Form ──────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Summary Card */}
              <div className="glass-card p-5 flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-dark-800">
                  {property.mainImage ? (
                    <img src={property.mainImage} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-lg truncate">{property.title}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">📍 {property.address}, {property.city}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-1 rounded-lg bg-primary-500/15 border border-primary-500/30 text-primary-400 capitalize">
                      {property.category}
                    </span>
                    {unit.unitNumber && (
                      <span className="text-xs text-gray-400">Unit: {unit.unitNumber}</span>
                    )}
                    {unit.floor && (
                      <span className="text-xs text-gray-400">Floor: {unit.floor}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Dynamic Form Sections ────────────────────────────────── */}
              {hasFields ? (
                SECTION_ORDER.map((sectionName) => {
                  const sectionFields = groupedFields[sectionName];
                  if (!sectionFields?.length) return null;

                  return (
                    <div key={sectionName} className="glass-card p-5">
                      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/10">
                        <span className="text-xl">{SECTION_ICONS[sectionName]}</span>
                        <h3 className="text-white font-semibold text-sm">{sectionName}</h3>
                        <span className="text-xs text-gray-600 ml-auto">
                          {sectionFields.length} field{sectionFields.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sectionFields.map(({ key, label, type, options }) => (
                          <div key={key} className={type === 'textarea' ? 'sm:col-span-2' : ''}>
                            <label className="form-label">
                              {label} <span className="text-red-400">*</span>
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
                                      : 'border-white/15 hover:border-primary-500/40 hover:bg-white/2'
                                  }`}
                                >
                                  <span className="text-lg">{fileData[key] ? '✅' : '📎'}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-sm truncate ${fileData[key] ? 'text-emerald-300' : 'text-gray-400'}`}>
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
                              <p className="text-red-400 text-xs mt-1">{errors[key]}</p>
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
                  <p className="text-gray-400 text-sm">
                    No additional information required. You can proceed directly to payment.
                  </p>
                </div>
              )}

              {/* ── Submit Button ────────────────────────────────────────── */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-4 text-base font-semibold flex items-center justify-center gap-2"
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
          </div>

          {/* ── Right: Payment Summary ──────────────────────────────────── */}
          <div>
            <div className="glass-card p-5 sticky top-20 space-y-4">
              <h3 className="text-white font-bold text-sm border-b border-white/10 pb-3">
                💰 Payment Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Price</span>
                  <span className="text-white font-semibold">৳{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Booking Money ({percentage}%)</span>
                  <span className="text-emerald-400 font-bold">৳{bookingMoney.toLocaleString()}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
                  <span className="text-gray-400">Due After Booking</span>
                  <span className="text-amber-400 font-semibold">৳{dueAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                <p className="text-primary-300 text-xs leading-relaxed">
                  💡 You will pay <strong>৳{bookingMoney.toLocaleString()}</strong> now as booking money.
                  The remaining <strong>৳{dueAmount.toLocaleString()}</strong> can be paid later from your dashboard.
                </p>
              </div>

              {/* Security badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {['🔒 Secure', '💳 Stripe', '🛡️ Protected'].map((badge) => (
                  <span key={badge} className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-500">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCheckoutPage;
