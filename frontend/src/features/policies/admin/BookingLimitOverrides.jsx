import { useState, useEffect } from 'react';
import axiosInstance from '../../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// BookingLimitOverrides — Policy 3 Super Admin view: users who have hit their
// active-booking cap, with the ability to grant a higher limit + reason.
// ─────────────────────────────────────────────────────────────────────────────
const BookingLimitOverrides = () => {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseLimit, setBaseLimit] = useState(5);
  const [editing, setEditing] = useState(null); // userId being edited
  const [draft, setDraft]     = useState({ overrideLimit: '', reason: '' });
  const [busy, setBusy]       = useState(false);

  const load = () => {
    setLoading(true);
    axiosInstance.get('/admin/booking-limits')
      .then(({ data }) => { setUsers(data.data.users); setBaseLimit(data.data.baseLimit); })
      .catch(() => toast.error('Failed to load booking limits'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openGrant = (u) => {
    setEditing(u.userId);
    setDraft({ overrideLimit: u.overrideLimit || u.limit + 5, reason: '' });
  };

  const submitGrant = async (userId) => {
    if (!draft.overrideLimit || Number(draft.overrideLimit) < 1) {
      return toast.error('Enter a valid limit');
    }
    setBusy(true);
    try {
      await axiosInstance.post(`/admin/users/${userId}/booking-override`, {
        overrideLimit: Number(draft.overrideLimit),
        reason: draft.reason,
      });
      toast.success('Override granted');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant override');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (userId) => {
    if (!window.confirm('Revoke this user\'s booking override?')) return;
    try {
      await axiosInstance.delete(`/admin/users/${userId}/booking-override`);
      toast.success('Override revoked');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="text-gray-500 py-10 text-center">Loading…</div>;

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">
        Default limit: <strong className="text-gray-900">{baseLimit}</strong> active bookings per user.
        Users at or above their cap are listed below.
      </p>

      {users.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-900 font-medium">No users have hit their booking limit</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.userId} className="glass-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-gray-900 font-semibold">{u.user?.name || u.userId}</p>
                  <p className="text-xs text-gray-500">{u.user?.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    <strong className="text-amber-600">{u.activeCount}</strong> / {u.limit} active
                  </span>
                  {u.hasOverride && (
                    <span className="text-[10px] px-2 py-1 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      Override: {u.overrideLimit}
                    </span>
                  )}
                  {editing === u.userId ? null : (
                    <>
                      <button onClick={() => openGrant(u)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary-500/15 text-primary-600 border border-primary-500/30 hover:bg-primary-500/25">
                        {u.hasOverride ? 'Update' : 'Grant'} Override
                      </button>
                      {u.hasOverride && (
                        <button onClick={() => revoke(u.userId)} className="text-xs text-red-600 hover:underline">Revoke</button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {editing === u.userId && (
                <div className="mt-4 pt-4 border-t border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="form-label">New Limit</label>
                    <input
                      type="number" min="1"
                      value={draft.overrideLimit}
                      onChange={(e) => setDraft((d) => ({ ...d, overrideLimit: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Reason</label>
                    <input
                      type="text"
                      value={draft.reason}
                      onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))}
                      placeholder="e.g. Verified bulk investor"
                      className="form-input"
                    />
                  </div>
                  <div className="sm:col-span-3 flex gap-2">
                    <button onClick={() => submitGrant(u.userId)} disabled={busy} className="btn-primary text-xs py-2 px-4 disabled:opacity-60">
                      {busy ? 'Saving…' : 'Save Override'}
                    </button>
                    <button onClick={() => setEditing(null)} className="btn-secondary text-xs py-2 px-4">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingLimitOverrides;
