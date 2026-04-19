const Unit = require('./unit.model');

// ─────────────────────────────────────────────────────────────────────────────
// generateUnitsForProperty — called automatically when property is approved
// Creates floor × unitsPerFloor units (1A, 1B... 2A, 2B...)
// Exported so property.controller.js can call it on approval
// ─────────────────────────────────────────────────────────────────────────────
const generateUnitsForProperty = async (property) => {
  // Only generate once — skip if units already exist
  const existing = await Unit.countDocuments({ propertyId: property._id });
  if (existing > 0) return;

  const units = [];
  for (let floor = 1; floor <= property.totalFloors; floor++) {
    for (let ui = 0; ui < property.unitsPerFloor; ui++) {
      const letter = String.fromCharCode(65 + ui); // A, B, C...
      units.push({
        propertyId: property._id,
        floor,
        unitNumber: `${floor}${letter}`, // e.g. "3B"
        status: 'available',
      });
    }
  }
  await Unit.insertMany(units);
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all units for a property (grouped by floor)
// @route   GET /api/units/property/:propertyId
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getPropertyUnits = async (req, res) => {
  const units = await Unit.find({ propertyId: req.params.propertyId })
    .sort({ floor: 1, unitNumber: 1 });

  // Group by floor for the frontend visualizer
  const grouped = {};
  units.forEach((u) => {
    if (!grouped[u.floor]) grouped[u.floor] = [];
    grouped[u.floor].push(u);
  });

  // Stats
  const total     = units.length;
  const available = units.filter((u) => u.status === 'available').length;
  const booked    = units.filter((u) => u.status === 'booked').length;
  const sold      = units.filter((u) => u.status === 'sold').length;

  res.status(200).json({
    success: true,
    data: {
      units,
      grouped, // { "1": [...], "2": [...] }
      stats: { total, available, booked, sold },
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single unit details
// @route   GET /api/units/:id
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getUnit = async (req, res) => {
  const unit = await Unit.findById(req.params.id)
    .populate('propertyId', 'title price city')
    .populate('bookedBy', 'name email');

  if (!unit) {
    return res.status(404).json({ success: false, message: 'Unit not found' });
  }

  res.status(200).json({ success: true, data: { unit } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update unit status (Company Admin / Seller)
// @route   PUT /api/units/:id/status
// @access  Company Admin / Seller
// ─────────────────────────────────────────────────────────────────────────────
const updateUnitStatus = async (req, res) => {
  const { status } = req.body;

  if (!['available', 'booked', 'sold'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const unit = await Unit.findById(req.params.id);
  if (!unit) {
    return res.status(404).json({ success: false, message: 'Unit not found' });
  }

  unit.status = status;
  if (status !== 'booked') unit.bookedBy = null;
  await unit.save();

  res.status(200).json({
    success: true,
    message: `Unit ${unit.unitNumber} marked as ${status}`,
    data:    { unit },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update unit details (price, size, type, features)
// @route   PUT /api/units/:id
// @access  Company Admin / Seller
// ─────────────────────────────────────────────────────────────────────────────
const updateUnit = async (req, res) => {
  const { price, size, type, features, facing } = req.body;

  const unit = await Unit.findById(req.params.id);
  if (!unit) {
    return res.status(404).json({ success: false, message: 'Unit not found' });
  }

  if (price   !== undefined) unit.price    = Number(price);
  if (size    !== undefined) unit.size     = size;
  if (type    !== undefined) unit.type     = type;
  if (facing  !== undefined) unit.facing   = facing;
  if (features !== undefined) unit.features = features;

  await unit.save();

  res.status(200).json({ success: true, message: 'Unit updated', data: { unit } });
};

module.exports = {
  generateUnitsForProperty,
  getPropertyUnits,
  getUnit,
  updateUnitStatus,
  updateUnit,
};
