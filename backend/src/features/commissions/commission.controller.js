const mongoose = require('mongoose');
const Commission    = require('./commission.model');
const generateReportPDF = require('../../utils/generateReportPDF');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get total platform commission
// @route   GET /api/commissions/overview
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getPlatformOverview = async (req, res) => {
  const result = await Commission.aggregate([
    {
      $group: {
        _id: null,
        totalCommission: { $sum: '$commissionAmount' },
        totalSalesVolume: { $sum: '$totalPrice' },
        totalBookings: { $sum: 1 },
      },
    },
  ]);

  const stats = result[0] || { totalCommission: 0, totalSalesVolume: 0, totalBookings: 0 };

  res.status(200).json({
    success: true,
    data: stats,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get commission breakdown by Company
// @route   GET /api/commissions/companies
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getCompanyBreakdown = async (req, res) => {
  const companies = await Commission.aggregate([
    {
      $group: {
        _id: '$companyId',
        totalCommission: { $sum: '$commissionAmount' },
        totalSalesVolume: { $sum: '$totalPrice' },
        totalBookings: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'companies',
        localField: '_id',
        foreignField: '_id',
        as: 'company',
      },
    },
    {
      $unwind: '$company',
    },
    {
      $project: {
        _id: 1,
        companyName: '$company.name',
        companyEmail: '$company.email',
        totalCommission: 1,
        totalSalesVolume: 1,
        totalBookings: 1,
      },
    },
    {
      $sort: { totalCommission: -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: { companies },
  });
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
    {
      $match: { companyId: new mongoose.Types.ObjectId(companyId) },
    },
    {
      $group: {
        _id: '$propertyId',
        category: { $first: '$category' },
        commissionPercentage: { $first: '$commissionPercentage' },
        totalCommission: { $sum: '$commissionAmount' },
        totalSalesVolume: { $sum: '$totalPrice' },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: '_id',
        foreignField: '_id',
        as: 'property',
      },
    },
    {
      $unwind: '$property',
    },
    {
      $project: {
        _id: 1,
        propertyTitle: '$property.title',
        category: 1,
        commissionPercentage: 1,
        totalCommission: 1,
        totalSalesVolume: 1,
        bookingCount: 1,
      },
    },
    {
      $sort: { totalCommission: -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: { properties },
  });
};

// ───────────────────────────────────────────────────────────────────────────────
// @desc    Download platform margin/commission report as PDF
// @route   GET /api/commissions/margin-report/pdf
// @access  Super Admin
// ───────────────────────────────────────────────────────────────────────────────
const getMarginReportPDF = async (req, res) => {
  const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;

  // Overview totals
  const overviewResult = await Commission.aggregate([
    { $group: { _id: null, totalCommission: { $sum: '$commissionAmount' }, totalSalesVolume: { $sum: '$totalPrice' }, totalBookings: { $sum: 1 } } },
  ]);
  const overview = overviewResult[0] || { totalCommission: 0, totalSalesVolume: 0, totalBookings: 0 };

  // Per-company breakdown
  const companies = await Commission.aggregate([
    { $group: { _id: '$companyId', totalCommission: { $sum: '$commissionAmount' }, totalSalesVolume: { $sum: '$totalPrice' }, totalBookings: { $sum: 1 } } },
    { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
    { $unwind: '$company' },
    { $project: { companyName: '$company.name', totalCommission: 1, totalSalesVolume: 1, totalBookings: 1 } },
    { $sort: { totalCommission: -1 } },
  ]);

  const rows = companies.map((c, i) => [
    i + 1,
    c.companyName || '—',
    c.totalBookings,
    fmt(c.totalSalesVolume),
    fmt(c.totalCommission),
  ]);

  const pdfBuffer = await generateReportPDF({
    title:    'Platform Revenue & Margin Report',
    subtitle: 'Super Admin — Platform-Wide Commission Breakdown',
    dateRange: `Generated: ${new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    columns:  ['#', 'Company Name', 'Bookings', 'Sales Volume', 'Commission Earned'],
    colWidths: [30, 180, 65, 110, 110],
    rows,
    summaryRows: [
      { label: 'Total Bookings',    value: overview.totalBookings },
      { label: 'Total Sales Volume',value: fmt(overview.totalSalesVolume) },
      { label: 'Total Commission',  value: fmt(overview.totalCommission) },
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
