const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
  {
    roleTarget: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
      // e.g. 'vendor', 'customer', 'seller'
    },
    title: {
      type:    String,
      default: 'Terms & Conditions',
    },
    content: {
      type:     String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Policy', policySchema);
