import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../shared/lib/axiosInstance';
import LocationPicker from '../vendor/LocationPicker';
import PropertyPriceSection from './PropertyPriceSection';

const CATEGORIES = ['apartment', 'villa', 'land'];

// ── Reusable tiny components ──────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <h3 className="text-white font-semibold mb-4 pb-2 border-b border-white/10">{children}</h3>
);

const Field = ({ label, children, span2 }) => (
  <div className={span2 ? 'sm:col-span-2' : ''}>
    <label className="form-label">{label}</label>
    {children}
  </div>
);

const YesNoSelect = ({ name, value, onChange }) => (
  <select name={name} value={value} onChange={onChange} className="form-input">
    <option value="Yes">Yes</option>
    <option value="No">No</option>
  </select>
);

// ── Initial state factories ───────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
const AddPropertyForm = () => {
  const navigate = useNavigate();

  // ── Shared state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '', description: '', price: '',
    address: '', city: '', category: 'apartment',
    totalFloors: 1, unitsPerFloor: 4,
  });
  const [villaForm, setVillaForm] = useState({ ...VILLA_DEFAULTS });
  const [landForm, setLandForm]   = useState({ ...LAND_DEFAULTS });

  const [location, setLocation] = useState(null);
  const [images, setImages]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [submitted, setSubmitted] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────
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

  const handleImages = (e) => {
    const selected = Array.from(e.target.files).slice(0, 10);
    setImages(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Apartment visualizer helpers ────────────────────────────────────────────
  const floors = Math.max(1, Math.min(Number(form.totalFloors), 20));
  const unitPerFloor = Math.max(1, Math.min(Number(form.unitsPerFloor), 10));

  // ── Submit ──────────────────────────────────────────────────────────────────
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

    // Category-specific payloads
    if (form.category === 'villa') {
      fd.append('villaDetails', JSON.stringify(villaForm));
    }
    if (form.category === 'land') {
      fd.append('landDetails', JSON.stringify(landForm));
    }

    try {
      await axiosInstance.post('/properties', fd, {
        headers: { 'Content-Type': undefined },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit property.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl
                        text-red-400 text-sm animate-fadeIn">{error}</div>
      )}

      {/* ── Basic Info (shared) ──────────────────────────────────────────── */}
      <section>
        <SectionTitle>Basic Information</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Property Title *" span2>
            <input name="title" type="text" required value={form.title}
              onChange={handleChange} className="form-input"
              placeholder="Skyline Residences Block A" />
          </Field>
          <Field label="Category *">
            <select name="category" value={form.category} onChange={handleChange} className="form-input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City *">
            <input name="city" type="text" required value={form.city}
              onChange={handleChange} className="form-input" placeholder="Dhaka" />
          </Field>
          <Field label="Full Address *">
            <input name="address" type="text" required value={form.address}
              onChange={handleChange} className="form-input"
              placeholder="Road 10, Block C, Gulshan" />
          </Field>
          <Field label="Description *" span2>
            <textarea name="description" required rows={3} value={form.description}
              onChange={handleChange} className="form-input resize-none"
              placeholder="Describe the property, amenities, unique features..." />
          </Field>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* APARTMENT — Building Config + Mini Visualizer                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {form.category === 'apartment' && (
        <section>
          <SectionTitle>Building Configuration</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <Field label="Total Floors *">
              <input name="totalFloors" type="number" required min="1" max="100"
                value={form.totalFloors} onChange={handleChange} className="form-input" />
            </Field>
            <Field label="Units per Floor *">
              <input name="unitsPerFloor" type="number" required min="1" max="20"
                value={form.unitsPerFloor} onChange={handleChange} className="form-input" />
            </Field>
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
                      <div key={ui}
                        className="w-8 h-7 rounded bg-primary-500/20 border border-primary-500/30
                                   flex items-center justify-center text-primary-400 text-xs">
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
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VILLA — Full dynamic form                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {form.category === 'villa' && (
        <>
          {/* Location */}
          <section>
            <SectionTitle>🏡 Villa — Location</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Area *">
                <input name="area" type="text" value={villaForm.area}
                  onChange={handleVilla} className="form-input" placeholder="Gulshan, Dhaka" />
              </Field>
              <Field label="Road Access (distance from main road)">
                <input name="roadAccess" type="text" value={villaForm.roadAccess}
                  onChange={handleVilla} className="form-input" placeholder="100 meters" />
              </Field>
              <Field label="Neighborhood">
                <select name="neighborhood" value={villaForm.neighborhood} onChange={handleVilla} className="form-input">
                  <option value="Residential">Residential</option>
                  <option value="Resort">Resort</option>
                </select>
              </Field>
            </div>
          </section>

          {/* Property Overview */}
          <section>
            <SectionTitle>Property Overview</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Total Land Size (Katha)">
                <input name="totalLandSize" type="number" min="0" value={villaForm.totalLandSize}
                  onChange={handleVilla} className="form-input" placeholder="5" />
              </Field>
              <Field label="Total Floors">
                <input name="totalFloors" type="number" min="1" value={villaForm.totalFloors}
                  onChange={handleVilla} className="form-input" placeholder="2" />
              </Field>
              <Field label="Bedrooms">
                <input name="bedrooms" type="number" min="0" value={villaForm.bedrooms}
                  onChange={handleVilla} className="form-input" placeholder="4" />
              </Field>
              <Field label="Bathrooms">
                <input name="bathrooms" type="number" min="0" value={villaForm.bathrooms}
                  onChange={handleVilla} className="form-input" placeholder="3" />
              </Field>
              <Field label="Living Room">
                <YesNoSelect name="living" value={villaForm.living} onChange={handleVilla} />
              </Field>
              <Field label="Dining Room">
                <YesNoSelect name="dining" value={villaForm.dining} onChange={handleVilla} />
              </Field>
              <Field label="Kitchen">
                <YesNoSelect name="kitchen" value={villaForm.kitchen} onChange={handleVilla} />
              </Field>
              <Field label="Villa Description" span2>
                <textarea name="description" rows={3} value={villaForm.description}
                  onChange={handleVilla} className="form-input resize-none"
                  placeholder="Describe the villa layout and features..." />
              </Field>
            </div>
          </section>

          {/* Construction Details */}
          <section>
            <SectionTitle>Construction Details</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Construction Year">
                <input name="constructionYear" type="number" min="1900" max="2099"
                  value={villaForm.constructionYear} onChange={handleVilla}
                  className="form-input" placeholder="2023" />
              </Field>
              <Field label="Developer / Builder Name">
                <input name="developerName" type="text" value={villaForm.developerName}
                  onChange={handleVilla} className="form-input" placeholder="ABC Developers" />
              </Field>
              <Field label="Materials Quality">
                <select name="materialsQuality" value={villaForm.materialsQuality}
                  onChange={handleVilla} className="form-input">
                  <option value="Tiles">Tiles</option>
                  <option value="Fittings">Fittings</option>
                  <option value="Wood">Wood</option>
                  <option value="Marble">Marble</option>
                  <option value="Granite">Granite</option>
                </select>
              </Field>
              <Field label="Earthquake Resistant">
                <YesNoSelect name="earthquakeResistant" value={villaForm.earthquakeResistant} onChange={handleVilla} />
              </Field>
            </div>
          </section>

          {/* Features & Amenities */}
          <section>
            <SectionTitle>Features &amp; Amenities</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ['privatePool',    'Private Swimming Pool'],
                ['garden',         'Garden'],
                ['garage',         'Garage / Parking'],
                ['rooftopTerrace', 'Rooftop / Terrace'],
                ['servantRoom',    'Servant Room'],
                ['securitySystem', 'Security System'],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <YesNoSelect name={key} value={villaForm[key]} onChange={handleVilla} />
                </Field>
              ))}
            </div>
          </section>

        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAND — Full dynamic form                                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {form.category === 'land' && (
        <>
          {/* Location */}
          <section>
            <SectionTitle>🌿 Land — Location</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Area *">
                <input name="area" type="text" value={landForm.area}
                  onChange={handleLand} className="form-input" placeholder="Keraniganj, Dhaka" />
              </Field>
              <Field label="Road Access">
                <YesNoSelect name="roadAccess" value={landForm.roadAccess} onChange={handleLand} />
              </Field>
            </div>
          </section>

          {/* Land Size */}
          <section>
            <SectionTitle>Land Size &amp; Measurement</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Total Size (Katha)">
                <input name="totalSize" type="number" min="0" value={landForm.totalSize}
                  onChange={handleLand} className="form-input" placeholder="10" />
              </Field>
              <Field label="Plot Shape">
                <select name="plotShape" value={landForm.plotShape} onChange={handleLand} className="form-input">
                  <option value="Square">Square</option>
                  <option value="Rectangle">Rectangle</option>
                  <option value="Irregular">Irregular</option>
                </select>
              </Field>
            </div>
          </section>

          {/* Type & Usage */}
          <section>
            <SectionTitle>Land Type &amp; Usage</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Land Type">
                <select name="landType" value={landForm.landType} onChange={handleLand} className="form-input">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Agricultural">Agricultural</option>
                </select>
              </Field>
              <Field label="Filling Status">
                <select name="fillingStatus" value={landForm.fillingStatus} onChange={handleLand} className="form-input">
                  <option value="Low land">Low land</option>
                  <option value="Ready to use">Ready to use</option>
                </select>
              </Field>
              <Field label="Construction Ready">
                <YesNoSelect name="constructionReady" value={landForm.constructionReady} onChange={handleLand} />
              </Field>
            </div>
          </section>

          {/* Legal */}
          <section>
            <SectionTitle>Legal Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Khatian Number">
                <input name="khatianNumber" type="text" value={landForm.khatianNumber}
                  onChange={handleLand} className="form-input" placeholder="12345" />
              </Field>
              <Field label="Dag Number">
                <input name="dagNumber" type="text" value={landForm.dagNumber}
                  onChange={handleLand} className="form-input" placeholder="678" />
              </Field>
              <Field label="Land Ownership">
                <select name="landOwnership" value={landForm.landOwnership} onChange={handleLand} className="form-input">
                  <option value="Single owner">Single owner</option>
                  <option value="Multiple owners">Multiple owners</option>
                </select>
              </Field>
              <Field label="Any Dispute?">
                <YesNoSelect name="anyDispute" value={landForm.anyDispute} onChange={handleLand} />
              </Field>
            </div>
          </section>

          {/* Utilities */}
          <section>
            <SectionTitle>Utilities &amp; Facilities</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Electricity Line Available">
                <YesNoSelect name="electricityLine" value={landForm.electricityLine} onChange={handleLand} />
              </Field>
              <Field label="Gas / Water Connection">
                <YesNoSelect name="gasWaterConnection" value={landForm.gasWaterConnection} onChange={handleLand} />
              </Field>
              <Field label="Drainage System">
                <YesNoSelect name="drainageSystem" value={landForm.drainageSystem} onChange={handleLand} />
              </Field>
            </div>
          </section>

          {/* Nearby Facilities */}
          <section>
            <SectionTitle>Nearby Facilities</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="School">
                <input name="nearbySchool" type="text" value={landForm.nearbySchool}
                  onChange={handleLand} className="form-input" placeholder="School names nearby" />
              </Field>
              <Field label="Hospital">
                <input name="nearbyHospital" type="text" value={landForm.nearbyHospital}
                  onChange={handleLand} className="form-input" placeholder="Hospital names nearby" />
              </Field>
              <Field label="Market">
                <input name="nearbyMarket" type="text" value={landForm.nearbyMarket}
                  onChange={handleLand} className="form-input" placeholder="Market names nearby" />
              </Field>
              <Field label="Future Development">
                <input name="futureDevelopment" type="text" value={landForm.futureDevelopment}
                  onChange={handleLand} className="form-input" placeholder="e.g. Road project, Metro" />
              </Field>
            </div>
          </section>

        </>
      )}

      {/* ── Unified Price Section (all categories) ────────────────────────── */}
      <PropertyPriceSection
        category={form.category}
        price={form.price}
        onChange={handleChange}
      />

      {/* ── Location on Map (shared) ──────────────────────────────────────── */}
      <section>
        <SectionTitle>
          Location on Map <span className="text-gray-500 font-normal text-sm">(optional)</span>
        </SectionTitle>
        <LocationPicker value={location} onChange={setLocation} />
      </section>

      {/* ── Property Images (shared) ──────────────────────────────────────── */}
      <section>
        <SectionTitle>Property Images *</SectionTitle>
        <label htmlFor="property-images"
          className="flex flex-col items-center gap-3 px-6 py-7 rounded-xl border-2
            border-dashed border-white/15 hover:border-primary-500/50 hover:bg-white/3
            cursor-pointer transition-all duration-200 mb-4">
          <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="text-gray-300 text-sm font-medium">Upload property images</p>
          <p className="text-gray-500 text-xs">JPG, PNG, WebP · Max 5 MB each · Up to 10 images</p>
          <input id="property-images" type="file" accept="image/*" multiple
            onChange={handleImages} className="hidden" />
        </label>

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
                <button type="button" onClick={() => removeImage(i)}
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
            Uploading &amp; Submitting...
          </>
        ) : '🏠 Submit Property for Review'}
      </button>
    </form>
  );
};

export default AddPropertyForm;
