require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Booking = require('../features/bookings/booking.model');

const check = async () => {
  await connectDB();
  const bookings = await Booking.find({ status: 'cancelled' }).lean();
  console.log('--- Cancelled Bookings ---');
  console.log(JSON.stringify(bookings, null, 2));
  await mongoose.disconnect();
  process.exit(0);
};

check().catch(console.error);
