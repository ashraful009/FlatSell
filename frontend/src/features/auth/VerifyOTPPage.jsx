import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../shared/lib/axiosInstance';
import useAuth from '../../shared/hooks/useAuth';

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 600; // 10 minutes

const VerifyOTPPage = () => {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const { login }     = useAuth();
  const email         = params.get('email') || '';

  const [digits, setDigits]       = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(60);

  const inputRefs = useRef([]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Resend cooldown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── OTP input handlers ───────────────────────────────────────────────────
  const handleDigitChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const updated = [...digits];
    updated[idx] = val;
    setDigits(updated);
    setError('');
    if (val && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const updated = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, i) => { updated[i] = char; });
    setDigits(updated);
    // Focus last filled box
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
  };

  // ── Submit OTP ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosInstance.post('/auth/verify-otp', { email, otp });
      login(data.data.user); // Auto-login after verification
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError('');
    try {
      await axiosInstance.post('/auth/resend-otp', { email });
      setCountdown(OTP_EXPIRY_SECONDS);
      setResendCooldown(60);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Invalid verification link.</p>
          <Link to="/register" className="btn-primary">Back to Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80
                        bg-primary-600/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slideUp">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700
                            flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-xl">F</span>
            </div>
            <span className="text-2xl font-black text-white">
              Flat<span className="text-gradient">Sell</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Verify your email</h1>
          <p className="text-gray-400 text-sm mt-1">
            We sent a 6-digit code to{' '}
            <span className="text-primary-400 font-medium">{email}</span>
          </p>
        </div>

        <div className="glass-card p-7 sm:p-8">
          {/* OTP expiry countdown */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-400 text-sm">Code expires in</span>
            <span className={`font-mono font-semibold text-sm ${
              countdown < 60 ? 'text-red-400' : 'text-primary-400'
            }`}>
              {formatTime(countdown)}
            </span>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30
                            rounded-xl text-red-400 text-sm animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 6-digit OTP boxes */}
            <div className="flex gap-2.5 sm:gap-3 justify-center mb-7" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold
                    bg-white/5 border rounded-xl text-white
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all duration-200 caret-transparent
                    ${digit ? 'border-primary-500 bg-primary-500/10' : 'border-white/15'}`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button type="submit" disabled={loading || countdown === 0}
                    className="btn-primary w-full">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : 'Verify & Continue'}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-5">
            <p className="text-gray-400 text-sm">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className={`font-medium transition-colors ${
                  resendCooldown > 0
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-primary-400 hover:text-primary-300'
                }`}
              >
                {resending
                  ? 'Sending...'
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Code'
                }
              </button>
            </p>
          </div>

          <p className="text-center text-gray-500 text-xs mt-5">
            <Link to="/register" className="hover:text-gray-300 transition-colors">
              ← Use a different email
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
