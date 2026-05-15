// Unified price section shared across all 3 property category forms.
// Binds to `form.price` (the root property price field) for all categories.
// Villa and Land no longer carry a separate totalPrice in their subdocuments.
const PropertyPriceSection = ({ category, price, onChange }) => {
  const isApartment = category === 'Apartments' || category === 'apartment';
  const isVilla     = category === 'Villas'     || category === 'villa';

  const placeholder = isVilla ? '50000000' : isApartment ? '2500000' : '10000000';

  const hint = isApartment
    ? '💡 Base listing price shown on property cards. Per-unit prices are set in the Unit Types section.'
    : "💡 Booking money is calculated automatically from your company's Booking Policy settings.";

  return (
    <section className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/10">
        <span className="text-2xl">💰</span>
        <div>
          <h3 className="text-white font-semibold text-base">Price Information</h3>
          <p className="text-gray-500 text-xs mt-0.5">Property pricing and financial details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Total Price (BDT) <span className="text-red-400">*</span>
          </label>
          <input
            name="price"
            type="number"
            required
            min="0"
            value={price}
            onChange={onChange}
            className="form-input"
            placeholder={placeholder}
          />
        </div>

        <div className="flex items-end pb-0.5">
          <p className="text-xs text-gray-500 bg-white/3 rounded-lg border border-white/8 p-3 w-full leading-relaxed">
            {hint}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PropertyPriceSection;
