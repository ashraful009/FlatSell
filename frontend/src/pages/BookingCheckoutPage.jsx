import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// Constants
import { FIELD_META, SECTION_ORDER, SECTION_ICONS } from './booking-checkout/checkout.constants';

// Modular Components
import CheckoutHeader from './booking-checkout/components/CheckoutHeader';
import CheckoutPropertySummary from './booking-checkout/components/CheckoutPropertySummary';
import CheckoutForm from './booking-checkout/components/CheckoutForm';
import CheckoutSidebarSummary from './booking-checkout/components/CheckoutSidebarSummary';

const BookingCheckoutPage = () => {
  const { unitId } = useParams();
  const navigate   = useNavigate();

  const [unit, setUnit]         = useState(null);
  const [property, setProperty] = useState(null);
  const [policy, setPolicy]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Policy 2 — refund policy acknowledgment
  const [settings, setSettings]             = useState(null);
  const [refundAccepted, setRefundAccepted] = useState(false);
  // Policy 3 — booking limit block (null = allowed)
  const [limitBlock, setLimitBlock] = useState(null);

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

        // 4. Platform refund settings + booking-limit pre-check (Policies 2 & 3)
        try {
          const [settingsRes, limitRes] = await Promise.all([
            axiosInstance.get('/settings/public'),
            axiosInstance.get(`/bookings/limit-check?companyId=${companyId}`),
          ]);
          setSettings(settingsRes.data.data.settings);
          if (!limitRes.data.data.allowed) setLimitBlock(limitRes.data.data.blocked);
        } catch {
          // Non-fatal: fall back to default copy and allow the form to render
        }

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
    if (!refundAccepted) {
      toast.error('Please acknowledge the refund policy to continue');
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

      // Upload the KYC documents to Cloudinary first
      let documents = {};
      const fileKeys = Object.keys(fileData).filter((k) => fileData[k]);
      if (fileKeys.length > 0) {
        const docForm = new FormData();
        fileKeys.forEach((key) => docForm.append(key, fileData[key]));
        const uploadRes = await axiosInstance.post('/checkout/upload-documents', docForm, {
          headers: { 'Content-Type': undefined },
        });
        documents = uploadRes.data?.data?.documents || {};
      }

      const response = await axiosInstance.post('/checkout/create-session', {
        unitId: unit._id,
        message: formData.message || '',
        kycData,
        documents: Object.keys(documents).length > 0 ? documents : null,
        refundPolicyAccepted: refundAccepted,
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
          <p className="text-gray-500">Loading checkout form...</p>
        </div>
      </div>
    );
  }

  if (!property || !unit) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <p className="text-red-600">Unable to load property data.</p>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">Go Back</button>
        </div>
      </div>
    );
  }

  // ── Policy 3: booking limit reached — block the form ──────────────────────
  if (limitBlock) {
    const isTotal = limitBlock.code === 'TOTAL_LIMIT';
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <span className="text-5xl block mb-4">{isTotal ? '🚦' : '⛔'}</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Limit Reached</h2>
          <p className="text-gray-500 text-sm mb-6">{limitBlock.reason}</p>
          <div className="flex flex-col gap-3">
            {isTotal && (
              <a
                href="mailto:icsteamservice@gmail.com?subject=Booking%20Limit%20Override%20Request"
                className="btn-primary w-full"
              >
                📨 Contact Super Admin
              </a>
            )}
            <button onClick={() => navigate(-1)} className="btn-secondary w-full">
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasFields = activeFieldKeys.length > 0;
  const retentionPct = settings?.refundRetentionPercentage ?? 20;
  const refundWindowDays = settings?.refundWindowDays ?? 30;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container-main py-8">
        {/* Header */}
        <CheckoutHeader navigate={navigate} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Dynamic Form */}
          <div className="lg:col-span-2 space-y-6">
            <CheckoutPropertySummary property={property} unit={unit} />
            <CheckoutForm
              hasFields={hasFields}
              sectionOrder={SECTION_ORDER}
              groupedFields={groupedFields}
              sectionIcons={SECTION_ICONS}
              formData={formData}
              fileData={fileData}
              errors={errors}
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              refundAccepted={refundAccepted}
              setRefundAccepted={setRefundAccepted}
              refundWindowDays={refundWindowDays}
              retentionPct={retentionPct}
              submitting={submitting}
              bookingMoney={bookingMoney}
              handleSubmit={handleSubmit}
            />
          </div>

          {/* Right: Payment Summary */}
          <div>
            <CheckoutSidebarSummary
              totalPrice={totalPrice}
              percentage={percentage}
              bookingMoney={bookingMoney}
              dueAmount={dueAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCheckoutPage;
