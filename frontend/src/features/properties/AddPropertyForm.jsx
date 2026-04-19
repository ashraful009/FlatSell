import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../shared/lib/axiosInstance';
import LocationPicker from '../vendor/LocationPicker';

const CATEGORIES = ['apartment', 'commercial', 'land', 'villa', 'office'];

const AddPropertyForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', price: '',
    address: '', city: '', category: 'apartment',
    totalFloors: 1, unitsPerFloor: 4,
  });
  const [location,   setLocation]   = useState(null);
  const [images,     setImages]     = useState([]);        // File[]
  const [previews,   setPreviews]   = useState([]);        // Blob URLs
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [submitted,  setSubmitted]  = useState(false);

  const handleChange = (e) => {
    setError('');
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Image upload preview ─────────────────────────────────────────────────
  const handleImages = (e) => {
    const selected = Array.from(e.target.files).slice(0, 10);
    setImages(selected);
    const urls = selected.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Floor / Unit mini-visualizer ─────────────────────────────────────────
  const floors     = Math.max(1, Math.min(Number(form.totalFloors), 20));
  const unitPerFloor = Math.max(1, Math.min(Number(form.unitsPerFloor), 10));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('Please upload at least one property image.');
      return;
    }
    setLoading(true);
    setError('');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (location?.lat) {
      fd.append('lat', location.lat);
      fd.append('lng', location.lng);
    }
    images.forEach((img) => fd.append('images', img));

    try {
      await axiosInstance.post('/properties', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit property.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-10 animate-slideUp">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40
                        flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Property Submitted! 🏠</h2>
        <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
          Your property is pending review. It will appear publicly once approved by the admin.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setSubmitted(false)} className="btn-secondary">Add Another</button>
          <button onClick={() => navigate('/company-admin')} className="btn-primary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl
                        text-red-400 text-sm animate-fadeIn">{error}</div>
      )}

      {/* ── Basic Info ─────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-white font-semibold mb-4 pb-2 border-b border-white/10">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Property Title *</label>
            <input name="title" type="text" required value={form.title}
              onChange={handleChange} className="form-input"
              placeholder="Skyline Residences Block A" />
          </div>
          <div>
            <label className="form-label">Booking Money (BDT) *</label>
            <input name="price" type="number" required min="0" value={form.price}
              onChange={handleChange} className="form-input" placeholder="2500000" />
          </div>
          <div>
            <label className="form-label">Category *</label>
            <select name="category" value={form.category} onChange={handleChange}
                    className="form-input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">City *</label>
            <input name="city" type="text" required value={form.city}
              onChange={handleChange} className="form-input" placeholder="Dhaka" />
          </div>
          <div>
            <label className="form-label">Full Address *</label>
            <input name="address" type="text" required value={form.address}
              onChange={handleChange} className="form-input"
              placeholder="Road 10, Block C, Gulshan" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description *</label>
            <textarea name="description" required rows={3} value={form.description}
              onChange={handleChange} className="form-input resize-none"
              placeholder="Describe the property, amenities, unique features..." />
          </div>
        </div>
      </section>

      {/* ── Building Config + Mini Visualizer ──────────────────────────────── */}
      <section>
        <h3 className="text-white font-semibold mb-4 pb-2 border-b border-white/10">
          Building Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="form-label">Total Floors *</label>
            <input name="totalFloors" type="number" required min="1" max="100"
              value={form.totalFloors} onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label className="form-label">Units per Floor *</label>
            <input name="unitsPerFloor" type="number" required min="1" max="20"
              value={form.unitsPerFloor} onChange={handleChange} className="form-input" />
          </div>
        </div>

        {/* Live mini-visualizer */}
        <div className="bg-dark-800/50 rounded-xl p-4 border border-white/5">
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
            Preview — {floors} floor{floors > 1 ? 's' : ''} ×{' '}
            {unitPerFloor} unit{unitPerFloor > 1 ? 's' : ''} ={' '}
            <strong className="text-white">{floors * unitPerFloor} total units</strong>
          </p>
          <div className="flex flex-col-reverse gap-1 max-h-48 overflow-y-auto">
            {Array.from({ length: Math.min(floors, 20) }).map((_, fi) => (
              <div key={fi} className="flex items-center gap-1.5">
                <span className="text-gray-600 text-xs w-6 text-right flex-shrink-0">
                  {fi + 1}
                </span>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: unitPerFloor }).map((_, ui) => (
                    <div
                      key={ui}
                      className="w-8 h-7 rounded bg-primary-500/20 border border-primary-500/30
                                 flex items-center justify-center text-primary-400 text-xs"
                    >
                      {ui + 1}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {floors > 20 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Preview shows first 20 floors
            </p>
          )}
        </div>
      </section>

      {/* ── Location ──────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-white font-semibold mb-4 pb-2 border-b border-white/10">
          Location on Map <span className="text-gray-500 font-normal text-sm">(optional)</span>
        </h3>
        <LocationPicker value={location} onChange={setLocation} />
      </section>

      {/* ── Images ────────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-white font-semibold mb-4 pb-2 border-b border-white/10">
          Property Images *
        </h3>

        {/* Drop zone */}
        <label htmlFor="property-images"
          className="flex flex-col items-center gap-3 px-6 py-7 rounded-xl border-2
            border-dashed border-white/15 hover:border-primary-500/50 hover:bg-white/3
            cursor-pointer transition-all duration-200 mb-4">
          <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24"
               stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="text-gray-300 text-sm font-medium">Upload property images</p>
          <p className="text-gray-500 text-xs">JPG, PNG, WebP · Max 5 MB each · Up to 10 images</p>
          <input id="property-images" type="file" accept="image/*" multiple
            onChange={handleImages} className="hidden" />
        </label>

        {/* Image preview grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden
                                     border border-white/10">
                <img src={src} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute top-1 left-1 bg-primary-500 text-white
                                  text-xs px-1.5 py-0.5 rounded font-medium">
                    Cover
                  </div>
                )}
                <button
                  type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full
                             text-white flex items-center justify-center opacity-0
                             group-hover:opacity-100 transition-opacity text-xs">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Submit ──────────────────────────────────────────────────────────── */}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading & Submitting...
          </>
        ) : '🏠 Submit Property for Review'}
      </button>
    </form>
  );
};

export default AddPropertyForm;
