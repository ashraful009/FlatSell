import { useState, useRef } from 'react';
import { useNavigate }     from 'react-router-dom';
import axiosInstance       from '../../shared/lib/axiosInstance';
import LocationPicker      from '../vendor/LocationPicker';

// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = ['Apartments', 'Villas', 'Commercial', 'Land', 'Office'];

const CATEGORY_ICONS = {
  Apartments: '🏢',
  Villas:     '🏡',
  Commercial: '🏪',
  Land:       '🌾',
  Office:     '🏬',
};

const YES_NO = ['Yes', 'No'];

const defaultFlatType = () => ({
  label:        '',
  sqft:         '',
  pricePerUnit: '',
  bedrooms:     1,
  bathrooms:    1,
  kitchen:      'Yes',
  dining:       'Yes',
  drawing:      'No',
  parking:      'No',
  description:  '',
});

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/10">
    <span className="text-2xl">{icon}</span>
    <div>
      <h3 className="text-white font-semibold text-base">{title}</h3>
      {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Field Components
// ─────────────────────────────────────────────────────────────────────────────
const FormField = ({ label, required, children }) => (
  <div>
    <label className="form-label">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const SelectField = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={onChange} className="form-input">
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o} value={o}>{o}</option>
    ))}
  </select>
);

// ─────────────────────────────────────────────────────────────────────────────
// AddPropertyWizard
// ─────────────────────────────────────────────────────────────────────────────
const AddPropertyWizard = ({ onSuccess, defaultCategory = 'Apartments' }) => {
  const navigate = useNavigate();

  // ── Core form state ───────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title:           '',
    description:     '',
    price:           '',
    address:         '',
    city:            '',
    category:        defaultCategory,
    totalFloors:     5,
    unitsPerFloor:   4,
    totalUnitsCount: '',
    landSize:        '',
    handoverTime:    '',
  });

  const [flatTypes,     setFlatTypes]     = useState([defaultFlatType()]);
  const [location,      setLocation]      = useState(null);
  const [mainImage,     setMainImage]     = useState(null);
  const [mainPreview,   setMainPreview]   = useState('');
  const [gallery,       setGallery]       = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [submitted,     setSubmitted]     = useState(false);

  const mainImgRef    = useRef();
  const galleryImgRef = useRef();

  const showFlatTypes = ['Apartments', 'Villas'].includes(form.category);

  // ── Form field change ─────────────────────────────────────────────────────
  const handleChange = (e) => {
    setError('');
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Main image ────────────────────────────────────────────────────────────
  const handleMainImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMainImage(file);
    setMainPreview(URL.createObjectURL(file));
  };

  // ── Gallery images ────────────────────────────────────────────────────────
  const handleGallery = (e) => {
    const selected = Array.from(e.target.files).slice(0, 10 - gallery.length);
    setGallery((prev) => [...prev, ...selected].slice(0, 10));
    setGalleryPreviews((prev) =>
      [...prev, ...selected.map((f) => URL.createObjectURL(f))].slice(0, 10)
    );
  };

  const removeGallery = (idx) => {
    setGallery((prev)         => prev.filter((_, i) => i !== idx));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Flat Types CRUD ───────────────────────────────────────────────────────
  const addFlatType = () => setFlatTypes((prev) => [...prev, defaultFlatType()]);

  const removeFlatType = (idx) =>
    setFlatTypes((prev) => prev.filter((_, i) => i !== idx));

  const updateFlatType = (idx, field, value) =>
    setFlatTypes((prev) =>
      prev.map((ft, i) => (i === idx ? { ...ft, [field]: value } : ft))
    );

  // ── Visualizer helpers ────────────────────────────────────────────────────
  const floors       = Math.max(1, Math.min(Number(form.totalFloors),   30));
  const unitsPerFlr  = Math.max(1, Math.min(Number(form.unitsPerFloor), 12));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mainImage) {
      setError('Please upload a main building image.');
      return;
    }

    setLoading(true);
    setError('');

    const fd = new FormData();
    // Core fields
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    // Location
    if (location?.lat) {
      fd.append('lat', location.lat);
      fd.append('lng', location.lng);
    }
    // Images
    fd.append('mainImage', mainImage);
    gallery.forEach((img) => fd.append('galleryImages', img));
    // Flat types (serialized)
    fd.append('flatTypes', JSON.stringify(showFlatTypes ? flatTypes : []));

    try {
      await axiosInstance.post('/properties', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit property.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-14 animate-fadeIn">
        <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/40
                        flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Property Submitted! 🏠</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
          Your property is pending review. It will appear publicly once approved by the admin.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSubmitted(false); setForm({ title:'', description:'', price:'', address:'', city:'', category:'Apartments', totalFloors:5, unitsPerFloor:4, totalUnitsCount:'', landSize:'', handoverTime:'' }); setFlatTypes([defaultFlatType()]); setMainImage(null); setMainPreview(''); setGallery([]); setGalleryPreviews([]); }} className="btn-secondary">
            Add Another
          </button>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl
                        text-red-400 text-sm animate-fadeIn flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── SECTION 1: Basic Info ──────────────────────────────────────── */}
      <section className="glass-card p-6">
        <SectionHeader icon="📋" title="Basic Information" subtitle="Core property details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Category */}
          <div className="sm:col-span-2">
            <label className="form-label">Category <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat} type="button"
                  onClick={() => setForm((p) => ({ ...p, category: cat }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium
                    transition-all duration-200
                    ${form.category === cat
                      ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                      : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                    }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="sm:col-span-2">
            <FormField label="Property Title" required>
              <input name="title" type="text" required value={form.title}
                onChange={handleChange} className="form-input"
                placeholder="e.g. Skyline Residences Block A" />
            </FormField>
          </div>

          {/* Price */}
          <FormField label="Booking Money (BDT)" required>
            <input name="price" type="number" required min="0" value={form.price}
              onChange={handleChange} className="form-input" placeholder="2500000" />
          </FormField>

          {/* City */}
          <FormField label="City" required>
            <input name="city" type="text" required value={form.city}
              onChange={handleChange} className="form-input" placeholder="Dhaka" />
          </FormField>

          {/* Address */}
          <div className="sm:col-span-2">
            <FormField label="Full Address" required>
              <input name="address" type="text" required value={form.address}
                onChange={handleChange} className="form-input"
                placeholder="Road 10, Block C, Gulshan, Dhaka" />
            </FormField>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Property Overview ──────────────────────────────── */}
      <section className="glass-card p-6">
        <SectionHeader icon="🏗️" title="Property Overview" subtitle="Building specifications" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Total Units">
            <input name="totalUnitsCount" type="number" min="0" value={form.totalUnitsCount}
              onChange={handleChange} className="form-input" placeholder="e.g. 40" />
          </FormField>
          <FormField label="Total Floors" required>
            <input name="totalFloors" type="number" required min="1" max="100"
              value={form.totalFloors} onChange={handleChange} className="form-input" />
          </FormField>
          <FormField label="Units per Floor" required>
            <input name="unitsPerFloor" type="number" required min="1" max="20"
              value={form.unitsPerFloor} onChange={handleChange} className="form-input" />
          </FormField>
          <FormField label="Land Size">
            <input name="landSize" type="text" value={form.landSize}
              onChange={handleChange} className="form-input" placeholder="e.g. 5 Katha" />
          </FormField>
          <FormField label="Handover Time">
            <input name="handoverTime" type="text" value={form.handoverTime}
              onChange={handleChange} className="form-input" placeholder="e.g. Q4 2026" />
          </FormField>
        </div>
      </section>

      {/* ── SECTION 3: Description ────────────────────────────────────── */}
      <section className="glass-card p-6">
        <SectionHeader icon="📝" title="Building Description" subtitle="Describe the property in detail" />
        <textarea name="description" required rows={5} value={form.description}
          onChange={handleChange} className="form-input resize-none"
          placeholder="Describe the property, amenities, unique selling points, nearby landmarks, facilities..." />
      </section>

      {/* ── SECTION 4: Flat Types (Apartments / Villas) ───────────────── */}
      {showFlatTypes && (
        <section className="glass-card p-6">
          <SectionHeader
            icon="🏠"
            title="Unit Types"
            subtitle="Define different flat configurations (Type A, B, etc.)"
          />

          <div className="space-y-6">
            {flatTypes.map((ft, idx) => (
              <div key={idx}
                className="bg-white/3 border border-white/8 rounded-xl p-5 relative">
                {/* Remove button */}
                {flatTypes.length > 1 && (
                  <button type="button" onClick={() => removeFlatType(idx)}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center
                               rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30
                               text-sm transition-colors">
                    ✕
                  </button>
                )}

                <p className="text-primary-400 text-xs font-semibold mb-4 uppercase tracking-wider">
                  Type {idx + 1}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Label */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FormField label="Type Label">
                      <input type="text" value={ft.label} placeholder="e.g. Type A 1200 sft"
                        onChange={(e) => updateFlatType(idx, 'label', e.target.value)}
                        className="form-input" />
                    </FormField>
                  </div>

                  {/* Sqft */}
                  <FormField label="Square Feet">
                    <input type="number" min="0" value={ft.sqft} placeholder="1200"
                      onChange={(e) => updateFlatType(idx, 'sqft', e.target.value)}
                      className="form-input" />
                  </FormField>

                  {/* Price per unit */}
                  <FormField label="Price per Unit (BDT)">
                    <input type="number" min="0" value={ft.pricePerUnit} placeholder="4500000"
                      onChange={(e) => updateFlatType(idx, 'pricePerUnit', e.target.value)}
                      className="form-input" />
                  </FormField>

                  {/* Bedrooms */}
                  <FormField label="Bedrooms">
                    <input type="number" min="0" max="10" value={ft.bedrooms}
                      onChange={(e) => updateFlatType(idx, 'bedrooms', Number(e.target.value))}
                      className="form-input" />
                  </FormField>

                  {/* Bathrooms */}
                  <FormField label="Washrooms">
                    <input type="number" min="0" max="10" value={ft.bathrooms}
                      onChange={(e) => updateFlatType(idx, 'bathrooms', Number(e.target.value))}
                      className="form-input" />
                  </FormField>

                  {/* Dropdowns */}
                  {[
                    ['kitchen',  'Kitchen'],
                    ['dining',   'Dining'],
                    ['drawing',  'Drawing'],
                    ['parking',  'Parking Area'],
                  ].map(([field, label]) => (
                    <FormField key={field} label={label}>
                      <select value={ft[field]}
                        onChange={(e) => updateFlatType(idx, field, e.target.value)}
                        className="form-input">
                        {YES_NO.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </FormField>
                  ))}

                  {/* Type description */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FormField label="Type Description">
                      <textarea rows={2} value={ft.description}
                        onChange={(e) => updateFlatType(idx, 'description', e.target.value)}
                        className="form-input resize-none"
                        placeholder="Any special notes about this flat type..." />
                    </FormField>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addFlatType}
              className="w-full py-3 rounded-xl border-2 border-dashed border-primary-500/30
                         text-primary-400 hover:border-primary-500/60 hover:bg-primary-500/5
                         text-sm font-medium transition-all duration-200 flex items-center
                         justify-center gap-2">
              <span className="text-lg">+</span> Add Another Type
            </button>
          </div>
        </section>
      )}

      {/* ── SECTION 5: Floor & Unit Visualizer ───────────────────────── */}
      <section className="glass-card p-6">
        <SectionHeader
          icon="🗺️"
          title="Interactive Floor & Unit Visualizer"
          subtitle="Live preview of building layout — color coded by status"
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-5">
          {[
            { color: 'bg-green-400',  label: 'Available' },
            { color: 'bg-yellow-400', label: 'Booked / Pending' },
            { color: 'bg-red-400',    label: 'Sold' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`w-3 h-3 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-white/3 rounded-xl text-sm">
          <span className="text-green-400 font-semibold">{floors * unitsPerFlr}</span>
          <span className="text-gray-400">total units</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400">{floors} floors</span>
          <span className="text-gray-600">×</span>
          <span className="text-gray-400">{unitsPerFlr} units/floor</span>
        </div>

        {/* Visualizer grid */}
        <div className="bg-dark-800/60 rounded-xl p-4 border border-white/5
                        max-h-64 overflow-y-auto">
          <div className="flex flex-col-reverse gap-1.5">
            {Array.from({ length: Math.min(floors, 20) }).map((_, fi) => (
              <div key={fi} className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-7 text-right flex-shrink-0 font-mono">
                  F{fi + 1}
                </span>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: unitsPerFlr }).map((_, ui) => {
                    const letter = String.fromCharCode(65 + ui);
                    return (
                      <div key={ui}
                        className="w-10 h-8 rounded-lg bg-green-400/20 border border-green-400/40
                                   flex items-center justify-center text-green-300 text-xs font-mono
                                   hover:bg-green-400/30 transition-colors cursor-default">
                        {fi + 1}{letter}
                      </div>
                    );
                  })}
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

      {/* ── SECTION 6: Location ───────────────────────────────────────── */}
      <section className="glass-card p-6">
        <SectionHeader
          icon="📍"
          title="Location on Map"
          subtitle="Optional — pin the exact location for customers"
        />
        <LocationPicker value={location} onChange={setLocation} />
      </section>

      {/* ── SECTION 7: Images ─────────────────────────────────────────── */}
      <section className="glass-card p-6">
        <SectionHeader
          icon="🖼️"
          title="Property Images"
          subtitle="Main cover image + optional gallery (shown on property detail page)"
        />

        {/* Main Image */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-200 mb-3">
            Main Building Image <span className="text-red-400">*</span>
            <span className="text-gray-500 font-normal ml-1">(shown on homepage cards)</span>
          </p>
          <div
            onClick={() => mainImgRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed cursor-pointer
              transition-all duration-200 overflow-hidden
              ${mainPreview
                ? 'border-primary-500/40 bg-transparent'
                : 'border-white/15 hover:border-primary-500/50 hover:bg-white/3 h-40 flex items-center justify-center'
              }`}>
            {mainPreview ? (
              <div className="relative group">
                <img src={mainPreview} alt="main"
                  className="w-full h-56 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                                transition-opacity flex items-center justify-center rounded-xl">
                  <span className="text-white text-sm font-medium">Change Image</span>
                </div>
                <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs
                                  px-2 py-1 rounded-lg font-semibold">
                  📸 Cover
                </span>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-4xl block mb-2">🏢</span>
                <p className="text-gray-400 text-sm font-medium">Click to upload main image</p>
                <p className="text-gray-600 text-xs mt-1">JPG, PNG, WebP · Max 5 MB</p>
              </div>
            )}
          </div>
          <input ref={mainImgRef} type="file" accept="image/*" className="hidden"
            onChange={handleMainImage} />
        </div>

        {/* Gallery Images */}
        <div>
          <p className="text-sm font-semibold text-gray-200 mb-3">
            Gallery Images
            <span className="text-gray-500 font-normal ml-1">
              (shown in property detail — {gallery.length}/10)
            </span>
          </p>

          {/* Upload trigger */}
          {gallery.length < 10 && (
            <label htmlFor="gallery-images"
              className="flex flex-col items-center gap-2 px-6 py-5 rounded-xl border-2
                border-dashed border-white/10 hover:border-primary-500/40 hover:bg-white/2
                cursor-pointer transition-all duration-200 mb-4">
              <span className="text-2xl">🖼️</span>
              <p className="text-gray-400 text-sm">Upload gallery images</p>
              <p className="text-gray-600 text-xs">Up to {10 - gallery.length} more</p>
              <input id="gallery-images" type="file" accept="image/*" multiple
                className="hidden" ref={galleryImgRef} onChange={handleGallery} />
            </label>
          )}

          {/* Gallery preview grid */}
          {galleryPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {galleryPreviews.map((src, i) => (
                <div key={i}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeGallery(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full
                               text-white flex items-center justify-center opacity-0
                               group-hover:opacity-100 transition-opacity text-xs">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Submit ──────────────────────────────────────────────────────── */}
      <button type="submit" disabled={loading}
        className="btn-primary w-full py-4 text-base">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading & Submitting...
          </span>
        ) : '🏠 Submit Property'}
      </button>
    </form>
  );
};

export default AddPropertyWizard;
