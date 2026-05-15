import { useState, useRef, useMemo } from 'react';
import { useNavigate }     from 'react-router-dom';
import axiosInstance       from '../../shared/lib/axiosInstance';
import LocationPicker      from '../vendor/LocationPicker';
import PropertyPriceSection from './PropertyPriceSection';

// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = ['Apartments', 'Villas', 'Land'];

const CATEGORY_ICONS = {
  Apartments: '🏢',
  Villas:     '🏡',
  Land:       '🌿',
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

// ── Initial state factories for new categories ──────────────────────────────
const VILLA_DEFAULTS = {
  area: '', roadAccess: '', neighborhood: 'Residential',
  totalLandSize: '', totalFloors: '', bedrooms: '', bathrooms: '',
  living: 'Yes', dining: 'Yes', kitchen: 'Yes', description: '',
  constructionYear: '', developerName: '', materialsQuality: 'Tiles',
  earthquakeResistant: 'No',
  privatePool: 'No', garden: 'No', garage: 'No',
  rooftopTerrace: 'No', servantRoom: 'No', securitySystem: 'No',
};

const LAND_DEFAULTS = {
  area: '', roadAccess: 'No',
  totalSize: '', plotShape: 'Rectangle',
  landType: 'Residential', fillingStatus: 'Ready to use', constructionReady: 'No',
  khatianNumber: '', dagNumber: '', landOwnership: 'Single owner', anyDispute: 'No',
  electricityLine: 'No', gasWaterConnection: 'No', drainageSystem: 'No',
  nearbySchool: '', nearbyHospital: '', nearbyMarket: '', futureDevelopment: '',
};

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
const FormField = ({ label, required, children, span2 }) => (
  <div className={span2 ? 'sm:col-span-2' : ''}>
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

const YesNoSelect = ({ name, value, onChange }) => (
  <select name={name} value={value} onChange={onChange} className="form-input">
    <option value="Yes">Yes</option>
    <option value="No">No</option>
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

  const [villaForm, setVillaForm] = useState({ ...VILLA_DEFAULTS });
  const [landForm, setLandForm]   = useState({ ...LAND_DEFAULTS });

  const [flatTypes,     setFlatTypes]     = useState([defaultFlatType()]);
  const [location,      setLocation]      = useState(null);
  const [mainImage,     setMainImage]     = useState(null);
  const [mainPreview,   setMainPreview]   = useState('');
  const [gallery,       setGallery]       = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [submitted,     setSubmitted]     = useState(false);
  const [selectedUnit,  setSelectedUnit]  = useState(null); // { floor, col, typeIndex }

  const mainImgRef    = useRef();
  const galleryImgRef = useRef();

  const isApartment = form.category === 'Apartments';
  const isVilla = form.category === 'Villas';
  const isLand = form.category === 'Land';

  // ── Form field change ─────────────────────────────────────────────────────
  const handleChange = (e) => {
    setError('');
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVilla = (e) => {
    const { name, value } = e.target;
    setVillaForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLand = (e) => {
    const { name, value } = e.target;
    setLandForm((prev) => ({ ...prev, [name]: value }));
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
  const floors       = Math.max(1, Math.min(Number(form.totalFloors),   30));
  const unitsPerFlr  = Math.max(1, Math.min(Number(form.unitsPerFloor), 12));

  const addFlatType = () => {
    if (flatTypes.length >= unitsPerFlr) return;
    setFlatTypes((prev) => [...prev, defaultFlatType()]);
  };

  const removeFlatType = (idx) => {
    setFlatTypes((prev) => prev.filter((_, i) => i !== idx));
    setSelectedUnit(null);
  };

  const updateFlatType = (idx, field, value) =>
    setFlatTypes((prev) =>
      prev.map((ft, i) => (i === idx ? { ...ft, [field]: value } : ft))
    );

  // ── Visualizer helpers ────────────────────────────────────────────────────
  const TYPE_COLORS = [
    { bg: 'bg-blue-400/20',   border: 'border-blue-400/40',   text: 'text-blue-300',   dot: 'bg-blue-400' },
    { bg: 'bg-pink-400/20',   border: 'border-pink-400/40',   text: 'text-pink-300',   dot: 'bg-pink-400' },
    { bg: 'bg-amber-400/20',  border: 'border-amber-400/40',  text: 'text-amber-300',  dot: 'bg-amber-400' },
    { bg: 'bg-teal-400/20',   border: 'border-teal-400/40',   text: 'text-teal-300',   dot: 'bg-teal-400' },
    { bg: 'bg-purple-400/20', border: 'border-purple-400/40', text: 'text-purple-300', dot: 'bg-purple-400' },
    { bg: 'bg-rose-400/20',   border: 'border-rose-400/40',   text: 'text-rose-300',   dot: 'bg-rose-400' },
    { bg: 'bg-cyan-400/20',   border: 'border-cyan-400/40',   text: 'text-cyan-300',   dot: 'bg-cyan-400' },
    { bg: 'bg-lime-400/20',   border: 'border-lime-400/40',   text: 'text-lime-300',   dot: 'bg-lime-400' },
    { bg: 'bg-orange-400/20', border: 'border-orange-400/40', text: 'text-orange-300', dot: 'bg-orange-400' },
    { bg: 'bg-indigo-400/20', border: 'border-indigo-400/40', text: 'text-indigo-300', dot: 'bg-indigo-400' },
    { bg: 'bg-emerald-400/20',border: 'border-emerald-400/40',text: 'text-emerald-300',dot: 'bg-emerald-400' },
    { bg: 'bg-fuchsia-400/20',border: 'border-fuchsia-400/40',text: 'text-fuchsia-300',dot: 'bg-fuchsia-400' },
  ];

  const getTypeIndexForCol = (colIdx) => Math.min(colIdx, flatTypes.length - 1);

  const getUnitLabel = useMemo(() => {
    return (floorNum, colIdx) => {
      const typeIdx = getTypeIndexForCol(colIdx);
      const ft = flatTypes[typeIdx];
      const label = ft.label?.trim() || String.fromCharCode(65 + typeIdx);
      const sameTypeCols = [];
      for (let c = 0; c < unitsPerFlr; c++) {
        if (getTypeIndexForCol(c) === typeIdx) sameTypeCols.push(c);
      }
      if (sameTypeCols.length === 1) return `${floorNum}${label}`;
      const pos = sameTypeCols.indexOf(colIdx) + 1;
      return `${floorNum}${label}${pos}`;
    };
  }, [flatTypes, unitsPerFlr]);

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
    Object.entries(form).forEach(([k, v]) => {
      // Map frontend category 'Apartments'/'Villas'/'Land' to backend 'apartment'/'villa'/'land'
      if (k === 'category') {
        if (v === 'Apartments') fd.append(k, 'apartment');
        else if (v === 'Villas') fd.append(k, 'villa');
        else if (v === 'Land') fd.append(k, 'land');
        else fd.append(k, v.toLowerCase());
      } else {
        fd.append(k, v);
      }
    });

    // Location
    if (location?.lat) {
      fd.append('lat', location.lat);
      fd.append('lng', location.lng);
    }
    // Images
    fd.append('mainImage', mainImage);
    gallery.forEach((img) => fd.append('galleryImages', img));

    // Category Specific Payloads
    if (isApartment) {
      fd.append('flatTypes', JSON.stringify(flatTypes));
    } else if (isVilla) {
      const sanitizedVilla = { ...villaForm };
      ['totalLandSize', 'totalFloors', 'bedrooms', 'bathrooms', 'constructionYear'].forEach(key => {
        if (sanitizedVilla[key] === '') sanitizedVilla[key] = 0;
        else sanitizedVilla[key] = Number(sanitizedVilla[key]);
      });
      fd.append('villaDetails', JSON.stringify(sanitizedVilla));
    } else if (isLand) {
      const sanitizedLand = { ...landForm };
      if (sanitizedLand.totalSize === '') sanitizedLand.totalSize = 0;
      else sanitizedLand.totalSize = Number(sanitizedLand.totalSize);
      fd.append('landDetails', JSON.stringify(sanitizedLand));
    }

    try {
      await axiosInstance.post('/properties', fd, {
        headers: { 'Content-Type': undefined },
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
          <button onClick={() => {
            setSubmitted(false);
            setForm({ title:'', description:'', price:'', address:'', city:'', category:'Apartments', totalFloors:5, unitsPerFloor:4, totalUnitsCount:'', landSize:'', handoverTime:'' });
            setVillaForm({ ...VILLA_DEFAULTS });
            setLandForm({ ...LAND_DEFAULTS });
            setFlatTypes([defaultFlatType()]); 
            setMainImage(null); 
            setMainPreview(''); 
            setGallery([]); 
            setGalleryPreviews([]); 
          }} className="btn-secondary">
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
            <div className="grid grid-cols-3 gap-2 max-w-lg">
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
          
          {/* Shared Description */}
          <div className="sm:col-span-2">
            <FormField label="Property Description" required>
              <textarea name="description" required rows={3} value={form.description}
                onChange={handleChange} className="form-input resize-none"
                placeholder="Describe the property, amenities, unique selling points, nearby landmarks, facilities..." />
            </FormField>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* APARTMENT — Property Overview & Flat Types                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {isApartment && (
        <>
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

              {flatTypes.length < unitsPerFlr && (
                <button type="button" onClick={addFlatType}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-primary-500/30
                            text-primary-400 hover:border-primary-500/60 hover:bg-primary-500/5
                            text-sm font-medium transition-all duration-200 flex items-center
                            justify-center gap-2">
                  <span className="text-lg">+</span> Add Another Type ({flatTypes.length}/{unitsPerFlr})
                </button>
              )}
              {flatTypes.length >= unitsPerFlr && (
                <p className="text-center text-xs text-gray-500 py-2">
                  Maximum types reached ({unitsPerFlr}/{unitsPerFlr}) — matches units per floor
                </p>
              )}
            </div>
          </section>

          <section className="glass-card p-6">
            <SectionHeader
              icon="🗺️"
              title="Interactive Floor & Unit Visualizer"
              subtitle="Click any unit to view its type details"
            />

            {/* Type color legend */}
            <div className="flex flex-wrap gap-4 mb-5">
              {flatTypes.map((ft, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={`w-3 h-3 rounded-full ${TYPE_COLORS[idx % TYPE_COLORS.length].dot}`} />
                  {ft.label?.trim() || `Type ${String.fromCharCode(65 + idx)}`}
                  {idx === flatTypes.length - 1 && flatTypes.length < unitsPerFlr && (
                    <span className="text-gray-600">(col {idx + 1}–{unitsPerFlr})</span>
                  )}
                  {(idx < flatTypes.length - 1 || flatTypes.length === unitsPerFlr) && (
                    <span className="text-gray-600">(col {idx + 1})</span>
                  )}
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
              <span className="text-gray-600">·</span>
              <span className="text-gray-400">{flatTypes.length} type{flatTypes.length > 1 ? 's' : ''}</span>
            </div>

            {/* Visualizer grid */}
            <div className="bg-dark-800/60 rounded-xl p-4 border border-white/5
                            max-h-72 overflow-y-auto">
              <div className="flex flex-col-reverse gap-1.5">
                {Array.from({ length: Math.min(floors, 20) }).map((_, fi) => (
                  <div key={fi} className="flex items-center gap-2">
                    <span className="text-gray-600 text-xs w-7 text-right flex-shrink-0 font-mono">
                      F{fi + 1}
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: unitsPerFlr }).map((_, ui) => {
                        const typeIdx = getTypeIndexForCol(ui);
                        const colors = TYPE_COLORS[typeIdx % TYPE_COLORS.length];
                        const unitLabel = getUnitLabel(fi + 1, ui);
                        const isSelected = selectedUnit?.floor === fi + 1 && selectedUnit?.col === ui;
                        return (
                          <button type="button" key={ui}
                            onClick={() => setSelectedUnit({ floor: fi + 1, col: ui, typeIndex: typeIdx })}
                            className={`w-12 h-9 rounded-lg ${colors.bg} border ${colors.border}
                                      flex items-center justify-center ${colors.text} text-[10px] font-mono
                                      hover:brightness-125 transition-all cursor-pointer
                                      ${isSelected ? 'ring-2 ring-white/60 scale-110 z-10' : ''}`}>
                            {unitLabel}
                          </button>
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

            {/* ── Unit Detail Popup ───────────────────────────────────── */}
            {selectedUnit && (() => {
              const ft = flatTypes[selectedUnit.typeIndex];
              const colors = TYPE_COLORS[selectedUnit.typeIndex % TYPE_COLORS.length];
              const label = ft.label?.trim() || `Type ${String.fromCharCode(65 + selectedUnit.typeIndex)}`;
              return (
                <div className="mt-4 p-5 rounded-xl border border-white/10 bg-white/3 animate-fadeIn relative">
                  <button type="button" onClick={() => setSelectedUnit(null)}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center
                              rounded-full bg-white/10 text-gray-400 hover:bg-white/20 text-sm">✕</button>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-3 h-3 rounded-full ${colors.dot}`} />
                    <h4 className="text-white font-semibold text-sm">
                      Unit {getUnitLabel(selectedUnit.floor, selectedUnit.col)} — {label}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                    {[
                      ['🏷️ Type Label',     label],
                      ['📐 Square Feet',     ft.sqft ? `${ft.sqft} sft` : '—'],
                      ['💰 Price (BDT)',     ft.pricePerUnit ? `৳${Number(ft.pricePerUnit).toLocaleString()}` : '—'],
                      ['🛏️ Bedrooms',        ft.bedrooms ?? '—'],
                      ['🚿 Washrooms',       ft.bathrooms ?? '—'],
                      ['🍳 Kitchen',         ft.kitchen],
                      ['🍽️ Dining',          ft.dining],
                      ['🖼️ Drawing',         ft.drawing],
                      ['🅿️ Parking Area',    ft.parking],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="bg-white/3 rounded-lg p-2.5 border border-white/5">
                        <p className="text-gray-500 text-xs mb-0.5">{lbl}</p>
                        <p className="text-white font-medium text-xs">{val}</p>
                      </div>
                    ))}
                  </div>
                  {ft.description && (
                    <div className="mt-3 p-3 bg-white/3 rounded-lg border border-white/5">
                      <p className="text-gray-500 text-xs mb-1">📝 Type Description</p>
                      <p className="text-gray-300 text-xs">{ft.description}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VILLA — Full dynamic form                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {isVilla && (
        <>
          <section className="glass-card p-6">
            <SectionHeader icon="📍" title="Villa Location Details" subtitle="Specific location information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Area" required>
                <input name="area" type="text" value={villaForm.area}
                  onChange={handleVilla} className="form-input" placeholder="Gulshan, Dhaka" />
              </FormField>
              <FormField label="Road Access (distance from main road)">
                <input name="roadAccess" type="text" value={villaForm.roadAccess}
                  onChange={handleVilla} className="form-input" placeholder="100 meters" />
              </FormField>
              <FormField label="Neighborhood">
                <select name="neighborhood" value={villaForm.neighborhood} onChange={handleVilla} className="form-input">
                  <option value="Residential">Residential</option>
                  <option value="Resort">Resort</option>
                </select>
              </FormField>
            </div>
          </section>

          <section className="glass-card p-6">
            <SectionHeader icon="🏗️" title="Property Overview" subtitle="Building specifications" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Total Land Size (Katha)">
                <input name="totalLandSize" type="number" min="0" value={villaForm.totalLandSize}
                  onChange={handleVilla} className="form-input" placeholder="5" />
              </FormField>
              <FormField label="Total Floors">
                <input name="totalFloors" type="number" min="1" value={villaForm.totalFloors}
                  onChange={handleVilla} className="form-input" placeholder="2" />
              </FormField>
              <FormField label="Bedrooms">
                <input name="bedrooms" type="number" min="0" value={villaForm.bedrooms}
                  onChange={handleVilla} className="form-input" placeholder="4" />
              </FormField>
              <FormField label="Bathrooms">
                <input name="bathrooms" type="number" min="0" value={villaForm.bathrooms}
                  onChange={handleVilla} className="form-input" placeholder="3" />
              </FormField>
              <FormField label="Living Room">
                <YesNoSelect name="living" value={villaForm.living} onChange={handleVilla} />
              </FormField>
              <FormField label="Dining Room">
                <YesNoSelect name="dining" value={villaForm.dining} onChange={handleVilla} />
              </FormField>
              <FormField label="Kitchen">
                <YesNoSelect name="kitchen" value={villaForm.kitchen} onChange={handleVilla} />
              </FormField>
            </div>
          </section>

          <section className="glass-card p-6">
            <SectionHeader icon="🧱" title="Construction Details" subtitle="Building materials and quality" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Construction Year">
                <input name="constructionYear" type="number" min="1900" max="2099"
                  value={villaForm.constructionYear} onChange={handleVilla}
                  className="form-input" placeholder="2023" />
              </FormField>
              <FormField label="Developer / Builder Name">
                <input name="developerName" type="text" value={villaForm.developerName}
                  onChange={handleVilla} className="form-input" placeholder="ABC Developers" />
              </FormField>
              <FormField label="Materials Quality">
                <select name="materialsQuality" value={villaForm.materialsQuality}
                  onChange={handleVilla} className="form-input">
                  <option value="Tiles">Tiles</option>
                  <option value="Fittings">Fittings</option>
                  <option value="Wood">Wood</option>
                  <option value="Marble">Marble</option>
                  <option value="Granite">Granite</option>
                </select>
              </FormField>
              <FormField label="Earthquake Resistant">
                <YesNoSelect name="earthquakeResistant" value={villaForm.earthquakeResistant} onChange={handleVilla} />
              </FormField>
            </div>
          </section>

          <section className="glass-card p-6">
            <SectionHeader icon="✨" title="Features & Amenities" subtitle="What does the villa include?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ['privatePool',    'Private Swimming Pool'],
                ['garden',         'Garden'],
                ['garage',         'Garage / Parking'],
                ['rooftopTerrace', 'Rooftop / Terrace'],
                ['servantRoom',    'Servant Room'],
                ['securitySystem', 'Security System'],
              ].map(([key, label]) => (
                <FormField key={key} label={label}>
                  <YesNoSelect name={key} value={villaForm[key]} onChange={handleVilla} />
                </FormField>
              ))}
            </div>
          </section>

        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAND — Full dynamic form                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {isLand && (
        <>
          <section className="glass-card p-6">
            <SectionHeader icon="📍" title="Land Location Details" subtitle="Specific area information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Area" required>
                <input name="area" type="text" value={landForm.area}
                  onChange={handleLand} className="form-input" placeholder="Keraniganj, Dhaka" />
              </FormField>
              <FormField label="Road Access">
                <YesNoSelect name="roadAccess" value={landForm.roadAccess} onChange={handleLand} />
              </FormField>
            </div>
          </section>

          <section className="glass-card p-6">
            <SectionHeader icon="📏" title="Land Size & Measurement" subtitle="Plot dimensions" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Total Size (Katha)">
                <input name="totalSize" type="number" min="0" value={landForm.totalSize}
                  onChange={handleLand} className="form-input" placeholder="10" />
              </FormField>
              <FormField label="Plot Shape">
                <select name="plotShape" value={landForm.plotShape} onChange={handleLand} className="form-input">
                  <option value="Square">Square</option>
                  <option value="Rectangle">Rectangle</option>
                  <option value="Irregular">Irregular</option>
                </select>
              </FormField>
            </div>
          </section>

          <section className="glass-card p-6">
            <SectionHeader icon="🏷️" title="Land Type & Usage" subtitle="How can the land be used?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField label="Land Type">
                <select name="landType" value={landForm.landType} onChange={handleLand} className="form-input">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Agricultural">Agricultural</option>
                </select>
              </FormField>
              <FormField label="Filling Status">
                <select name="fillingStatus" value={landForm.fillingStatus} onChange={handleLand} className="form-input">
                  <option value="Low land">Low land</option>
                  <option value="Ready to use">Ready to use</option>
                </select>
              </FormField>
              <FormField label="Construction Ready">
                <YesNoSelect name="constructionReady" value={landForm.constructionReady} onChange={handleLand} />
              </FormField>
            </div>
          </section>

          <section className="glass-card p-6">
            <SectionHeader icon="⚖️" title="Legal Information" subtitle="Ownership and documents" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Khatian Number">
                <input name="khatianNumber" type="text" value={landForm.khatianNumber}
                  onChange={handleLand} className="form-input" placeholder="12345" />
              </FormField>
              <FormField label="Dag Number">
                <input name="dagNumber" type="text" value={landForm.dagNumber}
                  onChange={handleLand} className="form-input" placeholder="678" />
              </FormField>
              <FormField label="Land Ownership">
                <select name="landOwnership" value={landForm.landOwnership} onChange={handleLand} className="form-input">
                  <option value="Single owner">Single owner</option>
                  <option value="Multiple owners">Multiple owners</option>
                </select>
              </FormField>
              <FormField label="Any Dispute?">
                <YesNoSelect name="anyDispute" value={landForm.anyDispute} onChange={handleLand} />
              </FormField>
            </div>
          </section>

          <section className="glass-card p-6">
            <SectionHeader icon="⚡" title="Utilities & Facilities" subtitle="Connections available" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField label="Electricity Line Available">
                <YesNoSelect name="electricityLine" value={landForm.electricityLine} onChange={handleLand} />
              </FormField>
              <FormField label="Gas / Water Connection">
                <YesNoSelect name="gasWaterConnection" value={landForm.gasWaterConnection} onChange={handleLand} />
              </FormField>
              <FormField label="Drainage System">
                <YesNoSelect name="drainageSystem" value={landForm.drainageSystem} onChange={handleLand} />
              </FormField>
            </div>
          </section>

          <section className="glass-card p-6">
            <SectionHeader icon="🏫" title="Nearby Facilities" subtitle="Close landmarks" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="School">
                <input name="nearbySchool" type="text" value={landForm.nearbySchool}
                  onChange={handleLand} className="form-input" placeholder="School names nearby" />
              </FormField>
              <FormField label="Hospital">
                <input name="nearbyHospital" type="text" value={landForm.nearbyHospital}
                  onChange={handleLand} className="form-input" placeholder="Hospital names nearby" />
              </FormField>
              <FormField label="Market">
                <input name="nearbyMarket" type="text" value={landForm.nearbyMarket}
                  onChange={handleLand} className="form-input" placeholder="Market names nearby" />
              </FormField>
              <FormField label="Future Development">
                <input name="futureDevelopment" type="text" value={landForm.futureDevelopment}
                  onChange={handleLand} className="form-input" placeholder="e.g. Road project, Metro" />
              </FormField>
            </div>
          </section>

        </>
      )}

      {/* ── Unified Price Section (all categories) ────────────────────── */}
      <PropertyPriceSection
        category={form.category}
        price={form.price}
        onChange={handleChange}
      />

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
                <p className="text-gray-600 text-xs mt-1">JPG, PNG, WebP · Max 10 MB</p>
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
