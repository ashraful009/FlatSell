const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // ── Roles (a user can hold multiple roles) ───────────────
    roles: {
      type:    [String],
      enum:    ['Super Admin', 'Company Admin', 'seller', 'customer', 'user'],
      default: ['user'],
    },

    // ── Email Verification ───────────────────────────────────
    isVerified: { type: Boolean, default: false },
    otp:        { type: String,  default: null },
    otpExpiry:  { type: Date,    default: null },

    // ── Profile ──────────────────────────────────────────────
    avatar:  { type: String, default: '' },
    phone:   { type: String, default: '' },
  },
  { timestamps: true }
);

// ─── Hash password before saving ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance method: compare entered password with hashed ───────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ─── Strip sensitive fields from JSON output ─────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
