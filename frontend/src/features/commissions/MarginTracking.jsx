import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { key: 'all',        label: 'All Time'   },
  { key: 'today',      label: 'Today'      },
  { key: 'this_week',  label: 'This Week'  },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_year',  label: 'This Year'  },
  { key: 'custom',     label: 'Custom'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount) => `৳${Number(amount || 0).toLocaleString()}`;

/** Build URLSearchParams from filter state. */
const toQueryString = ({ filterType, startDate, endDate, companyId }) => {
  const p = new URLSearchParams();
  if (filterType && filterType !== 'all') p.set('filter_type', filterType);
  if (filterType === 'custom') {
    if (startDate) p.set('start_date', startDate);
    if (endDate)   p.set('end_date',   endDate);
  }
  if (companyId) p.set('company_id', companyId);
  return p.toString();
};

// ─────────────────────────────────────────────────────────────────────────────
const MarginTracking = () => {
  // ── Overview & company list ──────────────────────────────────────────────
  const [overview,   setOverview]   = useState({ totalCommission: 0, totalSalesVolume: 0, totalBookings: 0 });
  const [companies,  setCompanies]  = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ── Drill-down (existing Level-3 panel) ─────────────────────────────────
  const [selectedCompany,    setSelectedCompany]    = useState(null);
  const [companyProperties,  setCompanyProperties]  = useState([]);
  const [loadingProperties,  setLoadingProperties]  = useState(false);

  // ── Filter state (controls both on-screen data and PDF download) ─────────
  const [filterType,  setFilterType]  = useState('all');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [reportCompanyId, setReportCompanyId] = useState('');

  // ── Dropdown data ────────────────────────────────────────────────────────
  const [allCompanies, setAllCompanies] = useState([]); // loaded once for the dropdown

  // ── Download state ───────────────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false);

  // ── Validation ───────────────────────────────────────────────────────────
  const [filterError, setFilterError] = useState('');

  // ─── Applied filters (only committed on Apply click) ─────────────────────
  const [applied, setApplied] = useState({
    filterType: 'all', startDate: '', endDate: '', companyId: '',
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────────────────────

  const fetchOverview = useCallback(async (filters) => {
    try {
      const qs = toQueryString({ ...filters, companyId: '' }); // overview ignores company filter
      const { data } = await axiosInstance.get(`/commissions/overview${qs ? `?${qs}` : ''}`);
      setOverview(data.data);
    } catch {
      toast.error('Failed to load commission overview');
    }
  }, []);

  const fetchCompanies = useCallback(async (filters) => {
    try {
      const qs = toQueryString({ ...filters, companyId: '' }); // company list ignores company filter
      const { data } = await axiosInstance.get(`/commissions/companies${qs ? `?${qs}` : ''}`);
      setCompanies(data.data.companies || []);
    } catch {
      toast.error('Failed to load companies commission breakdown');
    }
  }, []);

  // Load once without filters — used to populate the "Company" dropdown
  const fetchAllCompaniesForDropdown = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/commissions/companies');
      setAllCompanies(data.data.companies || []);
    } catch {
      // non-critical — dropdown just stays empty
    }
  }, []);

  const fetchCompanyProperties = async (company) => {
    setSelectedCompany(company);
    setLoadingProperties(true);
    setCompanyProperties([]);
    try {
      const { data } = await axiosInstance.get(`/commissions/companies/${company._id}/properties`);
      setCompanyProperties(data.data.properties || []);
    } catch {
      toast.error('Failed to load property breakdown for company');
    } finally {
      setLoadingProperties(false);
    }
  };

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllCompaniesForDropdown();
  }, [fetchAllCompaniesForDropdown]);

  // ─── Re-fetch when applied filters change ────────────────────────────────
  useEffect(() => {
    setLoadingData(true);
    setSelectedCompany(null);
    setCompanyProperties([]);

    Promise.all([
      fetchOverview(applied),
      fetchCompanies(applied),
    ]).finally(() => setLoadingData(false));
  }, [applied, fetchOverview, fetchCompanies]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filter actions
  // ─────────────────────────────────────────────────────────────────────────

  const handlePresetClick = (key) => {
    setFilterType(key);
    setFilterError('');
    if (key !== 'custom') {
      // Preset ranges apply immediately (no date inputs needed)
      setStartDate('');
      setEndDate('');
      setApplied({ filterType: key, startDate: '', endDate: '', companyId: reportCompanyId });
    }
  };

  const handleApplyCustom = () => {
    if (!startDate || !endDate) {
      setFilterError('Please select both a start date and an end date.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFilterError('End date must be on or after the start date.');
      return;
    }
    setFilterError('');
    setApplied({ filterType: 'custom', startDate, endDate, companyId: reportCompanyId });
  };

  const handleCompanyFilterChange = (id) => {
    setReportCompanyId(id);
    // For non-custom ranges apply immediately; custom only applies on button
    if (filterType !== 'custom') {
      setApplied((prev) => ({ ...prev, companyId: id }));
    }
  };

  const handleResetFilters = () => {
    setFilterType('all');
    setStartDate('');
    setEndDate('');
    setReportCompanyId('');
    setFilterError('');
    setApplied({ filterType: 'all', startDate: '', endDate: '', companyId: '' });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PDF download (uses applied filters + reportCompanyId)
  // ─────────────────────────────────────────────────────────────────────────

  const handleDownloadMarginReport = async () => {
    // Validate custom range before allowing download
    if (filterType === 'custom') {
      if (!startDate || !endDate) {
        setFilterError('Please apply a valid custom date range before downloading.');
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setFilterError('End date must be on or after the start date.');
        return;
      }
    }

    setDownloading(true);
    try {
      const qs = toQueryString({
        filterType: applied.filterType,
        startDate:  applied.startDate,
        endDate:    applied.endDate,
        companyId:  reportCompanyId,
      });

      const res = await axiosInstance.get(
        `/commissions/margin-report/pdf${qs ? `?${qs}` : ''}`,
        { responseType: 'blob' }
      );

      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href     = url;
      link.download = `FlatSell-Margin-Report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Margin report downloaded!');
    } catch {
      toast.error('Failed to generate margin report PDF');
    } finally {
      setDownloading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derived UI helpers
  // ─────────────────────────────────────────────────────────────────────────

  const isFiltered = applied.filterType !== 'all' || applied.companyId;
  const selectedCompanyName = allCompanies.find((c) => c._id === reportCompanyId)?.companyName || '';

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Platform Revenue & Margin</h2>
          <p className="text-gray-400 text-sm mt-1">
            Track commissions generated from all vendor property sales.
          </p>
        </div>

        <button
          onClick={handleDownloadMarginReport}
          disabled={downloading || loadingData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-gradient-to-r from-emerald-600 to-emerald-700
                     hover:from-emerald-500 hover:to-emerald-600
                     text-white text-sm font-semibold transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          {downloading
            ? <><span className="animate-spin">⏳</span> Generating PDF...</>
            : <>📥 Download Margin Report</>
          }
        </button>
      </div>

      {/* ── Filter Panel ────────────────────────────────────────────────── */}
      <section className="glass-card p-5 border border-white/8">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <span className="text-base">🔍</span>
          <h3 className="text-white font-semibold text-sm">Report Filters</h3>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-xs text-gray-400 hover:text-white
                         px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              Reset All
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* ── Date preset buttons ──────────────────────────────────────── */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-2">Date Range</p>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetClick(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150
                    ${filterType === key
                      ? 'bg-primary-500/20 border-primary-500/60 text-primary-300'
                      : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white bg-white/3'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Custom date range inputs ─────────────────────────────────── */}
          {filterType === 'custom' && (
            <div className="flex flex-wrap items-end gap-3 pt-1 animate-fadeIn">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => { setStartDate(e.target.value); setFilterError(''); }}
                  className="form-input text-sm py-2 px-3 w-44"
                />
              </div>
              <span className="text-gray-500 pb-2.5">→</span>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => { setEndDate(e.target.value); setFilterError(''); }}
                  className="form-input text-sm py-2 px-3 w-44"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500
                           text-white text-xs font-semibold transition-colors"
              >
                Apply Range
              </button>
            </div>
          )}

          {/* ── Validation error ─────────────────────────────────────────── */}
          {filterError && (
            <p className="text-red-400 text-xs flex items-center gap-1.5 animate-fadeIn">
              <span>⚠️</span> {filterError}
            </p>
          )}

          {/* ── Company filter (for PDF scope) ───────────────────────────── */}
          <div className="pt-1 border-t border-white/8">
            <p className="text-xs text-gray-400 font-medium mb-2">
              Company Filter
              <span className="text-gray-600 font-normal ml-1">(scopes the downloaded report)</span>
            </p>
            <select
              value={reportCompanyId}
              onChange={(e) => handleCompanyFilterChange(e.target.value)}
              className="form-input text-sm py-2 max-w-xs"
            >
              <option value="">All Companies</option>
              {allCompanies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName || c.name || 'Unknown'}
                </option>
              ))}
            </select>
          </div>

          {/* ── Active filter summary badge ──────────────────────────────── */}
          {isFiltered && (
            <div className="flex flex-wrap gap-2 pt-1 animate-fadeIn">
              {applied.filterType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                 bg-primary-500/15 border border-primary-500/30
                                 text-primary-300 text-[11px] font-medium">
                  📅 {DATE_PRESETS.find((p) => p.key === applied.filterType)?.label}
                  {applied.filterType === 'custom' && applied.startDate && (
                    <> · {applied.startDate} → {applied.endDate}</>
                  )}
                </span>
              )}
              {reportCompanyId && selectedCompanyName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                 bg-emerald-500/15 border border-emerald-500/30
                                 text-emerald-300 text-[11px] font-medium">
                  🏢 Report: {selectedCompanyName}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Level 1: Platform Overview Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="glass-card p-6 border border-emerald-500/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400
                            flex items-center justify-center text-2xl">💰</div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Platform Commission</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {loadingData ? '...' : formatCurrency(overview.totalCommission)}
              </h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border border-primary-500/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary-500/20 text-primary-400
                            flex items-center justify-center text-2xl">📊</div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Sales Volume</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {loadingData ? '...' : formatCurrency(overview.totalSalesVolume)}
              </h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border border-blue-500/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400
                            flex items-center justify-center text-2xl">📝</div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Successful Bookings</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {loadingData ? '...' : overview.totalBookings}
              </h3>
            </div>
          </div>
        </div>

      </div>

      {/* ── Level 2 & 3: Company + Property drill-down ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-8">

        {/* Company Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-3">
            🏢 Commission Breakdown by Company
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-500 mb-3" />
                <p className="text-gray-400 text-sm">Loading...</p>
              </div>
            ) : companies.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                No commission data for the selected period.
              </p>
            ) : (
              companies.map((company) => (
                <div
                  key={company._id}
                  onClick={() => fetchCompanyProperties(company)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200
                    ${selectedCompany?._id === company._id
                      ? 'bg-primary-500/15 border-primary-500/50 shadow-[0_0_15px_rgba(var(--color-primary-500),0.15)]'
                      : 'bg-dark-800/50 border-white/5 hover:border-white/20 hover:bg-dark-800'
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-white truncate max-w-[60%]">
                      {company.companyName || 'Unknown Company'}
                    </h4>
                    <span className="text-emerald-400 font-bold">
                      {formatCurrency(company.totalCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{company.totalBookings} Bookings</span>
                    <span>Volume: {formatCurrency(company.totalSalesVolume)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Property Breakdown */}
        <div className="glass-card p-6 min-h-[400px]">
          {selectedCompany ? (
            <div>
              <div className="mb-4 border-b border-white/10 pb-3 flex justify-between items-end">
                <div>
                  <h3 className="text-lg font-bold text-white">🏠 Property Breakdown</h3>
                  <p className="text-primary-400 text-xs mt-1 font-medium">
                    {selectedCompany.companyName}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedCompany(null); setCompanyProperties([]); }}
                  className="text-gray-400 hover:text-white text-xs px-2 py-1
                             rounded bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Close ✕
                </button>
              </div>

              {loadingProperties ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4" />
                  <p className="text-gray-400 text-sm">Loading properties...</p>
                </div>
              ) : companyProperties.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  No properties found for this company.
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {companyProperties.map((prop) => (
                    <div key={prop._id}
                         className="p-4 rounded-xl bg-dark-800/30 border border-white/5">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-200 truncate" title={prop.propertyTitle}>
                            {prop.propertyTitle || 'Unknown Property'}
                          </h4>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px]
                                           uppercase font-semibold tracking-wider
                                           bg-white/10 text-gray-300">
                            {prop.category} ({prop.commissionPercentage}%)
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-emerald-400 font-bold text-sm">
                            {formatCurrency(prop.totalCommission)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            From {prop.bookingCount} Booking{prop.bookingCount > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs mt-3 pt-3 border-t border-white/5">
                        <span className="text-gray-500">Property Volume</span>
                        <span className="text-gray-300">{formatCurrency(prop.totalSalesVolume)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-50">
              <span className="text-5xl mb-4">👈</span>
              <p className="text-gray-300 font-medium">Select a company</p>
              <p className="text-gray-500 text-sm mt-1 max-w-[200px]">
                Click any company from the list to view its property-level commission breakdown.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MarginTracking;
