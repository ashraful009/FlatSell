import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../shared/lib/axiosInstance';
import LocationPicker from './LocationPicker';

const VendorApplicationForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:        '',
    email:       '',
    phone:       '',
    description: '',
  });
  const [location,  setLocation]  = useState(null);   // { lat, lng, address }
  const [pdfFile,   setPdfFile]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      setError('Only PDF files are accepted for Trade License.');
      setPdfFile(null);
      return;
    }
    setError('');
    setPdfFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location?.lat) {
      setError('Please click on the map to set your company location.');
      return;
    }
    if (!pdfFile) {
      setError('Please upload your Trade License (PDF).');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('name',         form.name);
    formData.append('email',        form.email);
    formData.append('phone',        form.phone);
    formData.append('description',  form.description);
    formData.append('lat',          location.lat);
    formData.append('lng',          location.lng);
    formData.append('address',      location.address || '');
    formData.append('tradeLicense', pdfFile); // multer field name

    try {
      await axiosInstance.post('/companies/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-10 animate-slideUp">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40
                        flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24"
               stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Application Submitted! 🎉</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
          Your vendor application is under review. We&apos;ll notify you via email
          within 3–5 business days.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30
                        rounded-xl text-red-400 text-sm animate-fadeIn">
          {error}
        </div>
      )}

      {/* ── Company Info ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="form-label">Company Name *</label>
          <input name="name" type="text" required value={form.name}
            onChange={handleChange} className="form-input"
            placeholder="Sunshine Realty Ltd." />
        </div>
        <div>
          <label className="form-label">Business Email *</label>
          <input name="email" type="email" required value={form.email}
            onChange={handleChange} className="form-input"
            placeholder="info@yourcompany.com" />
        </div>
        <div>
          <label className="form-label">Phone Number *</label>
          <input name="phone" type="tel" required value={form.phone}
            onChange={handleChange} className="form-input"
            placeholder="+880 1700-000000" />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">Company Description *</label>
          <textarea name="description" required rows={3}
            value={form.description} onChange={handleChange}
            className="form-input resize-none"
            placeholder="Tell us about your company, specializations and years of experience..." />
        </div>
      </div>

      {/* ── Location Map ──────────────────────────────────────────────────── */}
      <div>
        <label className="form-label">
          Company Location *{' '}
          <span className="text-gray-500 font-normal">(click on map to pin)</span>
        </label>
        <LocationPicker value={location} onChange={setLocation} />
      </div>

      {/* ── Trade License Upload ──────────────────────────────────────────── */}
      <div>
        <label className="form-label">Trade License (PDF) *</label>
        <label
          htmlFor="tradeLicense"
          className={`flex flex-col items-center gap-3 px-6 py-8 rounded-xl border-2
            border-dashed cursor-pointer transition-all duration-200
            ${pdfFile
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-white/15 hover:border-primary-500/50 hover:bg-white/3'
            }`}
        >
          {pdfFile ? (
            <>
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1
                     1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-center">
                <p className="text-green-400 font-medium text-sm">{pdfFile.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB — click to change
                </p>
              </div>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <div className="text-center">
                <p className="text-gray-300 font-medium text-sm">
                  Drop your Trade License PDF here
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  PDF only · Max 10 MB
                </p>
              </div>
            </>
          )}
          <input
            id="tradeLicense"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting Application...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Submit Application
          </>
        )}
      </button>
    </form>
  );
};

export default VendorApplicationForm;
