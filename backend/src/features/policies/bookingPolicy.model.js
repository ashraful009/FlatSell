const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// BookingPolicy — per-company, per-category KYC requirements & booking %
// ─────────────────────────────────────────────────────────────────────────────

const requiredFieldsSchema = new mongoose.Schema(
  {
    // Personal Info
    fullName:           { type: Boolean, default: false },
    fatherMotherName:   { type: Boolean, default: false },
    spouseName:         { type: Boolean, default: false },
    dob:                { type: Boolean, default: false },
    nidPassportNumber:  { type: Boolean, default: false },
    profession:         { type: Boolean, default: false },
    nationality:        { type: Boolean, default: false },

    // Contact Info
    mobile:             { type: Boolean, default: false },
    email:              { type: Boolean, default: false },
    presentAddress:     { type: Boolean, default: false },
    permanentAddress:   { type: Boolean, default: false },

    // Financial Info
    tinCertificate:     { type: Boolean, default: false },
    paymentSource:      { type: Boolean, default: false },
    bankDetails:        { type: Boolean, default: false },

    // Property Details
    projectNameLocation:{ type: Boolean, default: false },
    sizeFloor:          { type: Boolean, default: false },
    unitNumber:         { type: Boolean, default: false },
    carParking:         { type: Boolean, default: false },
    installmentPreference: { type: Boolean, default: false },

    // Nominee Info
    nomineeName:        { type: Boolean, default: false },
    nomineeRelation:    { type: Boolean, default: false },
    nomineeNid:         { type: Boolean, default: false },

    // Document Uploads
    customerPhoto:      { type: Boolean, default: false },
    nidCopy:            { type: Boolean, default: false },
    tinCopy:            { type: Boolean, default: false },
    nomineePhoto:       { type: Boolean, default: false },
    nomineeNidCopy:     { type: Boolean, default: false },
  },
  { _id: false }
);

const bookingPolicySchema = new mongoose.Schema(
  {
    companyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
    },
    category: {
      type:     String,
      enum:     ['apartment', 'villa', 'land'],
      required: true,
    },
    bookingMoneyPercentage: {
      type:    Number,
      default: 20,
      min:     1,
      max:     100,
    },
    requiredFields: {
      type:    requiredFieldsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// One policy per company per category
bookingPolicySchema.index({ companyId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('BookingPolicy', bookingPolicySchema);
