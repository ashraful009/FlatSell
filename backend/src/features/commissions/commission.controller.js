const mongoose         = require('mongoose');
const Commission       = require('./commission.model');
const Company          = require('../companies/company.model');
const generateReportPDF = require('../../utils/generateReportPDF');

// ─────────────────────────────────────────────────────────────────────────────
// Date-filter helpers
// ─────────────────────────────────────────────────────────────────────────────

const _startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const _endOfDay   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/**
 * Returns a Mongoose $match filter object for `createdAt`.
 * filter_type: today | this_week | this_month | this_year | custom | (omitted = all time)
 */
const buildDateFilter = ({ filter_type, start_date, end_date } = {}) => {
  const now = new Date();

  switch (filter_type) {
    case 'today':
      return { createdAt: { $gte: _startOfDay(now), $lte: _endOfDay(now) } };

    case 'this_week': {
      const dow  = now.getDay();
      const diff = dow === 0 ? -6 : 1 - dow; // Monday as week start
      const mon  = new Date(now);
      mon.setDate(now.getDate() + diff);
      return { createdAt: { $gte: _startOfDay(mon), $lte: _endOfDay(now) } };
    }

    case 'this_month':
      return {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: _endOfDay(now),
        },
      };

    case 'this_year':
      return {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: _endOfDay(now),
        },
      };

    case 'custom': {
      if (!start_date || !end_date) {
        throw new Error('start_date and end_date are required for a custom date range.');
      }
      const s = _startOfDay(new Date(start_date));
      const e = _endOfDay(new Date(end_date));
      if (isNaN(s) || isNaN(e)) throw new Error('Invalid date format.');
      if (s > e)                  throw new Error('start_date must be before end_date.');
      return { createdAt: { $gte: s, $lte: e } };
    }

    default:
      return {}; // All time — no filter
  }
};

/** Full human-readable date range label for PDF headers / API responses. */
const buildDateLabel = ({ filter_type, start_date, end_date } = {}) => {
  const now = new Date();
  const fmt = (d) =>
    d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });

  switch (filter_type) {
    case 'today':
      return `Today — ${fmt(now)}`;
    case 'this_week': {
      const dow  = now.getDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      const mon  = new Date(now);
      mon.setDate(now.getDate() + diff);
      return `${fmt(mon)} – ${fmt(now)}`;
    }
    case 'this_month':
      return `${fmt(new Date(now.getFullYear(), now.getMonth(), 1))} – ${fmt(now)}`;
    case 'this_year':
      return `${fmt(new Date(now.getFullYear(), 0, 1))} – ${fmt(now)}`;
    case 'custom':
      return `${fmt(new Date(start_date))} – ${fmt(new Date(end_date))}`;
    default:
      return 'All Time';
  }
};

/** Short label used inside PDF table rows (avoids overflowing narrow "Period" column). */
const buildShortPeriodLabel = ({ filter_type, start_date, end_date } = {}) => {
  const now = new Date();
  switch (filter_type) {
    case 'today':
      return 'Today';
    case 'this_week':
      return 'This Week';
    case 'this_month':
      return now.toLocaleDateString('en-BD', { month: 'short', year: 'numeric' });
    case 'this_year':
      return String(now.getFullYear());
    case 'custom': {
      const s = new Date(start_date).toLocaleDateString('en-BD', { day: '2-digit', month: 'short' });
      const e = new Date(end_date).toLocaleDateString('en-BD',   { day: '2-digit', month: 'short', year: 'numeric' });
      return `${s}–${e}`;
    }
    default:
      return 'All Time';
  }
};

/**
 * Builds the combined $match stage from date filter + optional company_id.
 * Used by overview and company-breakdown endpoints (date filter only).
 * The PDF endpoint adds company_id separately.
 */
const buildMatchStageFromQuery = (query = {}) => {
  const dateFilter = buildDateFilter(query);                // may throw
  return { ...dateFilter };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get total platform commission (supports date filters)
// @route   GET /api/commissions/overview
// @query   filter_type, start_date, end_date
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getPlatformOverview = async (req, res) => {
  let matchStage;
  try {
    matchStage = buildMatchStageFromQuery(req.query);
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }

  const pipeline = [
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id:              null,
        totalCommission:  { $sum: '$commissionAmount' },
        totalSalesVolume: { $sum: '$totalPrice' },
        totalBookings:    { $sum: 1 },
      },
    },
  ];

  const result = await Commission.aggregate(pipeline);
  const stats  = result[0] || { totalCommission: 0, totalSalesVolume: 0, totalBookings: 0 };

  res.status(200).json({ success: true, data: stats });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get commission breakdown by Company (supports date filters)
// @route   GET /api/commissions/companies
// @query   filter_type, start_date, end_date
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getCompanyBreakdown = async (req, res) => {
  let matchStage;
  try {
    matchStage = buildMatchStageFromQuery(req.query);
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }

  const pipeline = [
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id:              '$companyId',
        totalCommission:  { $sum: '$commissionAmount' },
        totalSalesVolume: { $sum: '$totalPrice' },
        totalBookings:    { $sum: 1 },
      },
    },
    { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
    { $unwind: '$company' },
    {
      $project: {
        _id:              1,
        companyName:      '$company.name',
        companyEmail:     '$company.email',
        totalCommission:  1,
        totalSalesVolume: 1,
        totalBookings:    1,
      },
    },
    { $sort: { totalCommission: -1 } },
  ];

  const companies = await Commission.aggregate(pipeline);
  res.status(200).json({ success: true, data: { companies } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get commission breakdown by Property for a specific Company
// @route   GET /api/commissions/companies/:companyId/properties
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getPropertyBreakdown = async (req, res) => {
  const { companyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    return res.status(400).json({ success: false, message: 'Invalid company ID' });
  }

  const properties = await Commission.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
    {
      $group: {
        _id:                  '$propertyId',
        category:             { $first: '$category' },
        commissionPercentage: { $first: '$commissionPercentage' },
        totalCommission:      { $sum: '$commissionAmount' },
        totalSalesVolume:     { $sum: '$totalPrice' },
        bookingCount:         { $sum: 1 },
      },
    },
    { $lookup: { from: 'properties', localField: '_id', foreignField: '_id', as: 'property' } },
    { $unwind: '$property' },
    {
      $project: {
        _id:                  1,
        propertyTitle:        '$property.title',
        category:             1,
        commissionPercentage: 1,
        totalCommission:      1,
        totalSalesVolume:     1,
        bookingCount:         1,
      },
    },
    { $sort: { totalCommission: -1 } },
  ]);

  res.status(200).json({ success: true, data: { properties } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Download filtered margin report as PDF
// @route   GET /api/commissions/margin-report/pdf
// @query   filter_type, start_date, end_date, company_id
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getMarginReportPDF = async (req, res) => {
  const { filter_type, start_date, end_date, company_id } = req.query;

  // ── Build match filter ──────────────────────────────────────────────────────
  let dateFilter;
  try {
    dateFilter = buildDateFilter({ filter_type, start_date, end_date });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }

  const matchStage = { ...dateFilter };
  let filteredCompanyName = null;

  if (company_id) {
    if (!mongoose.Types.ObjectId.isValid(company_id)) {
      return res.status(400).json({ success: false, message: 'Invalid company_id.' });
    }
    matchStage.companyId = new mongoose.Types.ObjectId(company_id);
    const co = await Company.findById(company_id).select('name').lean();
    filteredCompanyName = co?.name ?? null;
  }

  const matchArr   = Object.keys(matchStage).length ? [{ $match: matchStage }] : [];
  const dateLabel  = buildDateLabel({ filter_type, start_date, end_date });
  const shortLabel = buildShortPeriodLabel({ filter_type, start_date, end_date });
  const fmt        = (n) => `৳${Number(n || 0).toLocaleString()}`;

  // ── Run overview + per-company aggregations in parallel ───────────────────
  const [overviewResult, companies] = await Promise.all([
    Commission.aggregate([
      ...matchArr,
      {
        $group: {
          _id:              null,
          totalCommission:  { $sum: '$commissionAmount' },
          totalSalesVolume: { $sum: '$totalPrice' },
          totalBookings:    { $sum: 1 },
        },
      },
    ]),
    Commission.aggregate([
      ...matchArr,
      {
        $group: {
          _id:              '$companyId',
          totalCommission:  { $sum: '$commissionAmount' },
          totalSalesVolume: { $sum: '$totalPrice' },
          totalBookings:    { $sum: 1 },
          // distinct property count
          propertyIds:      { $addToSet: '$propertyId' },
        },
      },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
      { $unwind: '$company' },
      {
        $project: {
          companyName:         '$company.name',
          totalCommission:     1,
          totalSalesVolume:    1,
          totalBookings:       1,
          totalPropertiesSold: { $size: '$propertyIds' },
        },
      },
      { $sort: { totalCommission: -1 } },
    ]),
  ]);

  const overview        = overviewResult[0] || { totalCommission: 0, totalSalesVolume: 0, totalBookings: 0 };
  const netVendorRevenue = (overview.totalSalesVolume || 0) - (overview.totalCommission || 0);

  // ── Build PDF rows ────────────────────────────────────────────────────────
  // Columns: # | Company Name | Properties Sold | Sales Amount | Commission | Net Margin | Period
  // Widths:  25 | 140         | 65              | 75           | 75         | 75         | 40
  // Total:   495 ✓
  const rows = companies.map((c, i) => [
    i + 1,
    c.companyName || '—',
    c.totalPropertiesSold ?? 0,
    fmt(c.totalSalesVolume),
    fmt(c.totalCommission),
    fmt((c.totalSalesVolume || 0) - (c.totalCommission || 0)),
    shortLabel,
  ]);

  const pdfBuffer = await generateReportPDF({
    title:    'Platform Revenue & Margin Report',
    subtitle: filteredCompanyName
      ? `Company: ${filteredCompanyName}`
      : 'Super Admin — Platform-Wide Commission Breakdown',
    dateRange: dateLabel,
    summaryBox: [
      { label: 'Total Sales Volume',  value: fmt(overview.totalSalesVolume) },
      { label: 'Platform Commission', value: fmt(overview.totalCommission)  },
      { label: 'Net Vendor Revenue',  value: fmt(netVendorRevenue)          },
    ],
    columns:   ['#', 'Company Name', 'Properties Sold', 'Sales Amount', 'Commission', 'Net Margin', 'Period'],
    colWidths: [25,   140,            65,                75,             75,           75,           40],
    rows,
    summaryRows: [
      { label: 'Total Bookings',      value: overview.totalBookings               },
      { label: 'Total Sales Volume',  value: fmt(overview.totalSalesVolume)       },
      { label: 'Platform Commission', value: fmt(overview.totalCommission)        },
      { label: 'Net Vendor Revenue',  value: fmt(netVendorRevenue)               },
    ],
  });

  const filename = `FlatSell-Margin-Report-${Date.now()}.pdf`;
  res.setHeader('Content-Type',        'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length',      pdfBuffer.length);
  res.end(pdfBuffer);
};

module.exports = {
  getPlatformOverview,
  getCompanyBreakdown,
  getPropertyBreakdown,
  getMarginReportPDF,
};
