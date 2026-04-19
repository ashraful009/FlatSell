import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '../shared/lib/axiosInstance';
import useAuth from '../shared/hooks/useAuth';
import VendorPolicyModal  from '../features/vendor/VendorPolicyModal';
import VendorApplicationForm from '../features/vendor/VendorApplicationForm';
import LoadingScreen from '../shared/components/LoadingScreen';

const BecomeVendorPage = () => {
  const { user, isAuthenticated } = useAuth();

  const [step,          setStep]          = useState('policy'); // 'policy' | 'form'
  const [policy,        setPolicy]        = useState(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyError,   setPolicyError]   = useState('');

  // Redirect if already a vendor/admin
  const vendorRoles = ['Super Admin', 'Company Admin', 'seller'];
  const isAlreadyVendor = user?.roles?.some((r) => vendorRoles.includes(r));
  if (isAlreadyVendor) return <Navigate to="/" replace />;

  // Fetch vendor policy on mount
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data } = await axiosInstance.get('/policies/vendor');
        setPolicy(data.data.policy);
      } catch {
        setPolicyError('Failed to load Terms & Conditions. Please try again.');
      } finally {
        setPolicyLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-primary-950/40 to-transparent border-b border-white/5">
        <div className="container-main py-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-primary-400 text-sm font-medium mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9
                     0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1
                     1 0 011 1v5m-4 0h4" />
              </svg>
              Become a Vendor
            </div>
            <h1 className="section-title mb-2">
              List your properties on{' '}
              <span className="text-gradient">FlatSell</span>
            </h1>
            <p className="text-gray-400">
              Join thousands of real estate companies already selling on our platform.
            </p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-3 mt-8">
            {[
              { id: 'policy', label: '1. Review Terms' },
              { id: 'form',   label: '2. Apply'        },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  step === id ? 'bg-primary-400' : 'bg-white/20'
                }`} />
                <span className={`text-sm transition-colors duration-300 ${
                  step === id ? 'text-white font-medium' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {id === 'policy' && <span className="text-white/20 text-sm">›</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step Content ─────────────────────────────────────────────────── */}
      <div className="container-main py-10">
        {step === 'form' ? (
          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-6">
                Company Application
              </h2>
              <VendorApplicationForm />
            </div>
          </div>
        ) : (
          /* Policy step — show placeholder card while loading */
          <div className="max-w-2xl mx-auto">
            {policyLoading ? (
              <div className="glass-card p-8 space-y-4">
                <div className="skeleton-text w-1/3 h-6" />
                <div className="skeleton-text w-full" />
                <div className="skeleton-text w-5/6" />
                <div className="skeleton-text w-4/6" />
                <div className="skeleton-text w-full" />
                <div className="skeleton-text w-3/4" />
                <div className="skeleton h-10 w-full rounded-xl mt-6" />
              </div>
            ) : policyError ? (
              <div className="glass-card p-8 text-center">
                <p className="text-red-400 mb-4">{policyError}</p>
                <button onClick={() => window.location.reload()} className="btn-primary">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="glass-card p-6 sm:p-8 mb-5">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Before applying to list your properties on FlatSell, please carefully
                    read and accept our Vendor Terms & Conditions. Click the button below
                    to open and review the policy.
                  </p>
                  <button
                    onClick={() => document.getElementById('policy-modal-trigger')?.click()}
                    className="btn-primary mt-5"
                    id="policy-modal-trigger"
                    onClick={() => setStep('show-modal')}
                  >
                    📋 Read & Accept Terms
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Policy Modal ─────────────────────────────────────────────────── */}
      {step === 'show-modal' && policy && (
        <VendorPolicyModal
          title={policy.title}
          content={policy.content}
          onAccept={() => setStep('form')}
          onClose={() => setStep('policy')}
        />
      )}
    </div>
  );
};

export default BecomeVendorPage;
