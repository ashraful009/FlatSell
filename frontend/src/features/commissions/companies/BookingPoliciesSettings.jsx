import { useState, useEffect } from 'react';
import axiosInstance from '../../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Field definitions grouped by section
// ─────────────────────────────────────────────────────────────────────────────
const FIELD_SECTIONS = [
  {
    id: 'personal',
    title: 'Personal Information',
    icon: '👤',
    fields: [
      { key: 'fullName',          label: 'Full Name (NID/Passport matching)' },
      { key: 'fatherMotherName',  label: "Father's / Mother's Name" },
      { key: 'spouseName',        label: 'Spouse Name' },
      { key: 'dob',               label: 'Date of Birth' },
      { key: 'nidPassportNumber', label: 'NID / Passport Number' },
      { key: 'profession',        label: 'Profession / Company' },
      { key: 'nationality',       label: 'Nationality' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact Information',
    icon: '📞',
    fields: [
      { key: 'mobile',           label: 'Mobile Number' },
      { key: 'email',            label: 'Email Address' },
      { key: 'presentAddress',   label: 'Present Address' },
      { key: 'permanentAddress', label: 'Permanent Address' },
    ],
  },
  {
    id: 'financial',
    title: 'Financial Information',
    icon: '💳',
    fields: [
      { key: 'tinCertificate', label: 'TIN Certificate Number' },
      { key: 'paymentSource',  label: 'Payment Source' },
      { key: 'bankDetails',    label: 'Bank Details' },
    ],
  },
  {
    id: 'property',
    title: 'Property Details',
    icon: '🏠',
    fields: [
      { key: 'projectNameLocation',   label: 'Project Name / Location' },
      { key: 'sizeFloor',             label: 'Size / Floor' },
      { key: 'unitNumber',            label: 'Unit Number' },
      { key: 'carParking',            label: 'Car Parking Preference' },
      { key: 'installmentPreference', label: 'Installment Preference' },
    ],
  },
  {
    id: 'nominee',
    title: 'Nominee Information',
    icon: '👥',
    fields: [
      { key: 'nomineeName',     label: 'Nominee Name' },
      { key: 'nomineeRelation', label: 'Relation with Nominee' },
      { key: 'nomineeNid',      label: 'Nominee NID Number' },
    ],
  },
  {
    id: 'documents',
    title: 'Required Documents (Uploads)',
    icon: '📄',
    fields: [
      { key: 'customerPhoto', label: 'Customer Photo' },
      { key: 'nidCopy',       label: 'NID Copy' },
      { key: 'tinCopy',       label: 'TIN Certificate Copy' },
      { key: 'nomineePhoto',  label: 'Nominee Photo' },
      { key: 'nomineeNidCopy',label: 'Nominee NID Copy' },
    ],
  },
];

const CATEGORIES = [
  { key: 'apartment', label: 'Apartments', icon: '🏢', color: 'from-blue-600 to-blue-800',   border: 'border-blue-500/30',   activeBg: 'bg-blue-500/15',   activeText: 'text-blue-400' },
  { key: 'villa',     label: 'Villas',     icon: '🏡', color: 'from-emerald-600 to-emerald-800', border: 'border-emerald-500/30', activeBg: 'bg-emerald-500/15', activeText: 'text-emerald-400' },
  { key: 'land',      label: 'Land',       icon: '🌿', color: 'from-amber-600 to-amber-800', border: 'border-amber-500/30', activeBg: 'bg-amber-500/15', activeText: 'text-amber-400' },
];

// ─────────────────────────────────────────────────────────────────────────────
// BookingPoliciesSettings
// ─────────────────────────────────────────────────────────────────────────────
const BookingPoliciesSettings = () => {
  const [activeCategory, setActiveCategory] = useState('apartment');
  const [policies, setPolicies]     = useState({ apartment: null, villa: null, land: null });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  // Local form state for the active category
  const [percentage, setPercentage] = useState(20);
  const [fields, setFields]         = useState({});

  // ── Fetch policies on mount ─────────────────────────────────────────────
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const { data } = await axiosInstance.get('/booking-policies/my');
        setPolicies(data.data.policies);
      } catch {
        toast.error('Failed to load booking policies');
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  // ── Sync local state when switching category ────────────────────────────
  useEffect(() => {
    const policy = policies[activeCategory];
    if (policy) {
      setPercentage(policy.bookingMoneyPercentage || 20);
      setFields(policy.requiredFields || {});
    } else {
      setPercentage(20);
      setFields({});
    }
  }, [activeCategory, policies]);

  // ── Toggle a field ──────────────────────────────────────────────────────
  const toggleField = (key) => {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Select / Deselect all ───────────────────────────────────────────────
  const selectAll = () => {
    const allFields = {};
    FIELD_SECTIONS.forEach((section) => {
      section.fields.forEach((f) => { allFields[f.key] = true; });
    });
    setFields(allFields);
  };

  const deselectAll = () => {
    setFields({});
  };

  // ── Count selected ─────────────────────────────────────────────────────
  const totalFields = FIELD_SECTIONS.reduce((acc, s) => acc + s.fields.length, 0);
  const selectedCount = Object.values(fields).filter(Boolean).length;

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axiosInstance.put(`/booking-policies/${activeCategory}`, {
        bookingMoneyPercentage: percentage,
        requiredFields: fields,
      });
      setPolicies((prev) => ({ ...prev, [activeCategory]: data.data.policy }));
      toast.success(`${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} policy saved!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const activeCat = CATEGORIES.find((c) => c.key === activeCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📋 Booking Policies
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Configure KYC requirements and booking money percentage for each property category.
          Customers will be required to fill out the selected fields before proceeding to payment.
        </p>
      </div>

      {/* ── Category Tabs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          const policy   = policies[cat.key];
          const pct      = policy?.bookingMoneyPercentage || 20;
          const count    = policy?.requiredFields
            ? Object.values(policy.requiredFields).filter(Boolean).length
            : 0;

          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`relative p-4 rounded-xl border transition-all duration-300 text-left group
                ${isActive
                  ? `${cat.activeBg} ${cat.border} ${cat.activeText} ring-1 ring-inset`
                  : 'border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/3'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-semibold text-sm">{cat.label}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={isActive ? 'opacity-80' : 'text-gray-500'}>
                  {pct}% booking
                </span>
                <span className="text-gray-600">·</span>
                <span className={isActive ? 'opacity-80' : 'text-gray-500'}>
                  {count} fields
                </span>
              </div>
              {isActive && (
                <div className={`absolute -bottom-px left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${cat.color}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Booking Money Percentage ───────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              💰 Booking Money Percentage
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Percentage of total price required as booking money for {activeCat?.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="form-input w-20 text-center text-lg font-bold"
            />
            <span className="text-gray-400 text-lg font-bold">%</span>
          </div>
        </div>
        <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${activeCat?.color} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-600">
          <span>1%</span>
          <span className={activeCat?.activeText}>{percentage}% of total price</span>
          <span>100%</span>
        </div>
      </div>

      {/* ── Required Fields Checklist ──────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              ✅ Required KYC & Booking Fields
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Select which fields customers must fill out before booking a {activeCat?.label?.toLowerCase()} property
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${activeCat?.activeBg} ${activeCat?.border} ${activeCat?.activeText}`}>
              {selectedCount} / {totalFields}
            </span>
            <button onClick={selectAll}
              className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
              Select All
            </button>
            <button onClick={deselectAll}
              className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {FIELD_SECTIONS.map((section) => {
            const sectionSelected = section.fields.filter((f) => fields[f.key]).length;
            return (
              <div key={section.id}>
                {/* Section header */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                  <span className="text-base">{section.icon}</span>
                  <h4 className="text-gray-200 font-medium text-sm">{section.title}</h4>
                  <span className="text-xs text-gray-600 ml-auto">
                    {sectionSelected}/{section.fields.length}
                  </span>
                </div>

                {/* Field toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {section.fields.map((field) => {
                    const isChecked = !!fields[field.key];
                    return (
                      <label
                        key={field.key}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                          transition-all duration-200 group select-none
                          ${isChecked
                            ? `${activeCat?.activeBg} ${activeCat?.border}`
                            : 'border-white/5 hover:border-white/15 hover:bg-white/2'
                          }`}
                      >
                        {/* Custom checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center
                          transition-all duration-200 flex-shrink-0
                          ${isChecked
                            ? `bg-gradient-to-br ${activeCat?.color} border-transparent`
                            : 'border-gray-600 group-hover:border-gray-400'
                          }`}
                        >
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm transition-colors ${isChecked ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                          {field.label}
                        </span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={() => toggleField(field.key)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Save Button ────────────────────────────────────────────────── */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </>
        ) : (
          <>💾 Save {activeCat?.label} Policy</>
        )}
      </button>
    </div>
  );
};

export default BookingPoliciesSettings;
