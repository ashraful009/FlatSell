import { useState, useEffect } from 'react';
import axiosInstance from '../../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// PolicySettings — Super Admin editor for the platform-wide policy thresholds.
// Lets the admin retune every policy value (3 months, 20%, limit 5, …) WITHOUT
// a code change, satisfying the "General Requirements" of all three policies.
// ─────────────────────────────────────────────────────────────────────────────
const FIELDS = [
  { key: 'inactivityWarnMonths',       label: 'Inactivity Warning (months)',     hint: 'Send the warning email after this many months of no payment', group: 'Policy 1 — Auto-Cancellation' },
  { key: 'inactivityCancelMonths',     label: 'Inactivity Cancellation (months)', hint: 'Auto-cancel (no refund) after this many months of no payment', group: 'Policy 1 — Auto-Cancellation' },
  { key: 'refundWindowDays',           label: 'Refund Window (days)',            hint: 'Customers can request a refund within this many days of booking', group: 'Policy 2 — Voluntary Refund' },
  { key: 'refundRetentionPercentage',  label: 'Retention Fee (%)',               hint: 'Non-refundable percentage kept on a refund', group: 'Policy 2 — Voluntary Refund' },
  { key: 'maxActiveBookingsPerVendor', label: 'Max Active / Vendor',             hint: 'Max active bookings a user can hold with one vendor (no payment)', group: 'Policy 3 — Booking Limits' },
  { key: 'maxTotalActiveBookings',     label: 'Max Total Active',                hint: 'Max active bookings a user can hold across all vendors', group: 'Policy 3 — Booking Limits' },
];

const PolicySettings = () => {
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    axiosInstance.get('/settings')
      .then(({ data }) => setForm(data.data.settings))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      FIELDS.forEach(({ key }) => { payload[key] = Number(form[key]); });
      const { data } = await axiosInstance.put('/settings', payload);
      setForm(data.data.settings);
      toast.success('Policy settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <div className="text-gray-500 py-10 text-center">Loading settings…</div>;

  const groups = [...new Set(FIELDS.map((f) => f.group))];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Policy Settings</h3>
        <p className="text-gray-500 text-sm">Change these values to retune all three booking policies — no code change needed.</p>
      </div>

      {groups.map((group) => (
        <div key={group} className="glass-card p-5">
          <h4 className="text-sm font-semibold text-primary-600 mb-4">{group}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.filter((f) => f.group === group).map(({ key, label, hint }) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="form-input"
                />
                <p className="text-[11px] text-gray-500 mt-1">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
        {saving ? 'Saving…' : '💾 Save Settings'}
      </button>
    </div>
  );
};

export default PolicySettings;
