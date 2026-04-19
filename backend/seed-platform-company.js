/**
 * seed-platform-company.js
 * Run once: node seed-platform-company.js
 * Creates a "FlatSell Platform" system company owned by the Super Admin user.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./src/features/auth/user.model');
const Company  = require('./src/features/companies/company.model');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const superAdmin = await User.findOne({ roles: 'Super Admin' });
  if (!superAdmin) {
    console.error('No Super Admin user found. Please create one first.');
    process.exit(1);
  }
  console.log(`Found Super Admin: ${superAdmin.email}`);

  const existing = await Company.findOne({ name: 'FlatSell Platform' });
  if (existing) {
    console.log(`Platform company already exists (id: ${existing._id}). Status: ${existing.status}`);
    await mongoose.disconnect();
    return;
  }

  const company = await Company.create({
    name:         'FlatSell Platform',
    email:        superAdmin.email,
    phone:        '00000000000',
    description:  'Official FlatSell platform listings managed by Super Admin.',
    tradeLicense: 'system',
    ownerId:      superAdmin._id,
    status:       'approved',
    approvedAt:   new Date(),
    location:     { address: '', lat: 0, lng: 0 },
  });

  console.log(`✅ Created "FlatSell Platform" company (id: ${company._id})`);
  await mongoose.disconnect();
})();
