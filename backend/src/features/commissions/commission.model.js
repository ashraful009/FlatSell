const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // One commission per booking
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    category: {
      type: String,
      enum: ['apartment', 'villa', 'land'],
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionPercentage: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['earned', 'paid_out'],
      default: 'earned',
    },
  },
  { timestamps: true }
);

// Indexes to speed up aggregation pipelines
commissionSchema.index({ companyId: 1 });
commissionSchema.index({ propertyId: 1 });
commissionSchema.index({ category: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
