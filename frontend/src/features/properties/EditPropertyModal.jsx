import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../shared/lib/axiosInstance';

const YES_NO = ['Yes', 'No'];
const CATEGORIES = ['Apartments', 'Villas', 'Commercial', 'Land', 'Office'];

const defaultFlatType = () => ({
  label: '', sqft: '', pricePerUnit: '', bedrooms: 1, bathrooms: 1,
  kitchen: 'Yes', dining: 'Yes', drawing: 'No', parking: 'No', description: '',
});

const FormField = ({ label, required, children }) => (
  <div>
    <label className="form-label">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const EditPropertyModal = ({ property, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    title:           property.title           || '',
    description:     property.description     || '',
    price:           property.price           || '',
    address:         property.address         || '',
    city:            property.city            || '',
    category:        property.category       || 'Apartments',
    totalFloors:     property.totalFloors     || 1,
    unitsPerFloor:   property.unitsPerFloor   || 1,
    totalUnitsCount: property.totalUnitsCount || '',
    landSize:        property.landSize       || '',
    handoverTime:    property.handoverTime   || '',
  });

  const [flatTypes, setFlatTypes] = useState(
    property.flatTypes?.length ? property.flatTypes : [defaultFlatType()]
  );
  const [newMainImage, setNewMainImage] = useState(null);
  const [mainPreview,  setMainPreview]  = useState(property.mainImage || '');
  const [newGallery,   setNewGallery]   = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState(property.galleryImages || []);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const mainImgRef    = useRef();
  const galleryImgRef = useRef();

  const showFlatTypes = ['Apartments', 'Villas'].includes(form.category);

  // Prevent scroll underneath
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleChange = (e) => {
    setError('');
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleMainImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewMainImage(file);
    setMainPreview(URL.createObjectURL(file));
  };

  const handleGalleryAdd = (e) => {
    const selected = Array.from(e.target.files).slice(0, 10 - newGallery.length);
    setNewGallery((p) => [...p, ...selected].slice(0, 10));
    setGalleryPreviews((p) =>
      [...p, ...selected.map((f) => URL.createObjectURL(f))].slice(0, 10)
    );
  };

  const addFlatType    = () => setFlatTypes((p) => [...p, defaultFlatType()]);
  const removeFlatType = (idx) => setFlatTypes((p) => p.filter((_, i) => i !== idx));
  const updateFlatType = (idx, field, value) =>
    setFlatTypes((p) => p.map((ft, i) => (i === idx ? { ...ft, [field]: value } : ft)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('flatTypes', JSON.stringify(showFlatTypes ? flatTypes : []));
    if (newMainImage) fd.append('mainImage', newMainImage);
    newGallery.forEach((img) => fd.append('galleryImages', img));

    try {
      const { data } = await axiosInstance.put(`/properties/${property._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdated(data.data.property);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center
                    bg-black/75 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="w-full max-w-3xl glass-card animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Property</h2>
            <p className="text-gray-400 text-sm mt-0.5 truncate max-w-sm">{property.title}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white
                       transition-colors text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl
                            text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3 pb-2 border-b border-white/8">
              Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FormField label="Title" required>
                  <input name="title" required value={form.title} onChange={handleChange}
                    className="form-input" />
                </FormField>
              </div>
              <FormField label="Price (BDT)" required>
                <input name="price" type="number" required value={form.price}
                  onChange={handleChange} className="form-input" />
              </FormField>
              <FormField label="Category">
                <select name="category" value={form.category} onChange={handleChange}
                  className="form-input">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="City" required>
                <input name="city" required value={form.city} onChange={handleChange}
                  className="form-input" />
              </FormField>
              <FormField label="Address" required>
                <input name="address" required value={form.address} onChange={handleChange}
                  className="form-input" />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Description" required>
                  <textarea name="description" required rows={3} value={form.description}
                    onChange={handleChange} className="form-input resize-none" />
                </FormField>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3 pb-2 border-b border-white/8">
              Property Overview
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <FormField label="Total Floors">
                <input name="totalFloors" type="number" min="1" value={form.totalFloors}
                  onChange={handleChange} className="form-input" />
              </FormField>
              <FormField label="Units per Floor">
                <input name="unitsPerFloor" type="number" min="1" value={form.unitsPerFloor}
                  onChange={handleChange} className="form-input" />
              </FormField>
              <FormField label="Total Units">
                <input name="totalUnitsCount" type="number" min="0" value={form.totalUnitsCount}
                  onChange={handleChange} className="form-input" />
              </FormField>
              <FormField label="Land Size">
                <input name="landSize" value={form.landSize}
                  onChange={handleChange} className="form-input" placeholder="5 Katha" />
              </FormField>
              <FormField label="Handover Time">
                <input name="handoverTime" value={form.handoverTime}
                  onChange={handleChange} className="form-input" placeholder="Q4 2026" />
              </FormField>
            </div>
          </div>

          {/* Flat Types */}
          {showFlatTypes && (
            <div>
              <h4 className="text-white text-sm font-semibold mb-3 pb-2 border-b border-white/8">
                Unit Types
              </h4>
              <div className="space-y-4">
                {flatTypes.map((ft, idx) => (
                  <div key={idx}
                    className="bg-white/3 border border-white/8 rounded-xl p-4 relative">
                    {flatTypes.length > 1 && (
                      <button type="button" onClick={() => removeFlatType(idx)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center
                                   rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30
                                   text-xs transition-colors">
                        ✕
                      </button>
                    )}
                    <p className="text-primary-400 text-xs font-semibold mb-3 uppercase">Type {idx + 1}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-2 sm:col-span-3">
                        <FormField label="Label">
                          <input type="text" value={ft.label} placeholder="Type A 1200 sft"
                            onChange={(e) => updateFlatType(idx, 'label', e.target.value)}
                            className="form-input" />
                        </FormField>
                      </div>
                      <FormField label="Sqft">
                        <input type="number" value={ft.sqft}
                          onChange={(e) => updateFlatType(idx, 'sqft', e.target.value)}
                          className="form-input" />
                      </FormField>
                      <FormField label="Price/Unit">
                        <input type="number" value={ft.pricePerUnit}
                          onChange={(e) => updateFlatType(idx, 'pricePerUnit', e.target.value)}
                          className="form-input" />
                      </FormField>
                      <FormField label="Beds">
                        <input type="number" min="0" max="10" value={ft.bedrooms}
                          onChange={(e) => updateFlatType(idx, 'bedrooms', Number(e.target.value))}
                          className="form-input" />
                      </FormField>
                      <FormField label="Baths">
                        <input type="number" min="0" max="10" value={ft.bathrooms}
                          onChange={(e) => updateFlatType(idx, 'bathrooms', Number(e.target.value))}
                          className="form-input" />
                      </FormField>
                      {['kitchen','dining','drawing','parking'].map((f) => (
                        <FormField key={f} label={f.charAt(0).toUpperCase()+f.slice(1)}>
                          <select value={ft[f]}
                            onChange={(e) => updateFlatType(idx, f, e.target.value)}
                            className="form-input">
                            {YES_NO.map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </FormField>
                      ))}
                      <div className="col-span-2 sm:col-span-3">
                        <FormField label="Description">
                          <textarea rows={2} value={ft.description}
                            onChange={(e) => updateFlatType(idx, 'description', e.target.value)}
                            className="form-input resize-none" />
                        </FormField>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addFlatType}
                  className="w-full py-2.5 rounded-xl border border-dashed border-primary-500/30
                             text-primary-400 hover:bg-primary-500/5 text-sm transition-all flex
                             items-center justify-center gap-1">
                  + Add Type
                </button>
              </div>
            </div>
          )}

          {/* Images */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3 pb-2 border-b border-white/8">
              Images
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Main Image */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Main Cover Image</p>
                <div onClick={() => mainImgRef.current?.click()}
                  className="relative rounded-xl border border-dashed border-white/15
                             hover:border-primary-500/40 cursor-pointer overflow-hidden h-32">
                  {mainPreview ? (
                    <img src={mainPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                      Click to change
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100
                                  transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs">Change</span>
                  </div>
                </div>
                <input ref={mainImgRef} type="file" accept="image/*"
                  className="hidden" onChange={handleMainImage} />
              </div>

              {/* Gallery */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Gallery ({galleryPreviews.length}/10)</p>
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {galleryPreviews.map((src, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                {newGallery.length < 10 && (
                  <label className="block text-center py-2 rounded-lg border border-dashed
                                    border-white/10 text-gray-500 text-xs cursor-pointer
                                    hover:border-white/25 transition-colors">
                    + Add Images
                    <input type="file" accept="image/*" multiple className="hidden"
                      ref={galleryImgRef} onChange={handleGalleryAdd} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : '✓ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;
