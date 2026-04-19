import { useState, useEffect } from 'react';
import axiosInstance from '../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  pending:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const CompanyApproval = () => {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [viewDoc,   setViewDoc]   = useState(null); // PDF URL

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data } = await axiosInstance.get('/companies');
      setCompanies(data.data.companies);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axiosInstance.put(`/companies/${id}/status`, { status });
      setCompanies((prev) => prev.map((c) => (c._id === id ? { ...c, status } : c)));
      toast.success(`Company ${status} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update company status');
    }
  };

  if (loading) return <div className="text-gray-400 py-10 text-center">Loading companies...</div>;

  return (
    <>
      <div className="space-y-4">
        {companies.map((c) => (
          <div key={c._id} className="glass-card p-5 flex flex-col md:flex-row gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">{c.name}</h3>
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${STATUS_COLORS[c.status]}`}>
                  {c.status.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-1 gap-x-6 text-sm mb-3">
                <p className="text-gray-400"><span className="text-gray-500">Email:</span> {c.email}</p>
                <p className="text-gray-400"><span className="text-gray-500">Phone:</span> {c.phone}</p>
                <p className="text-gray-400"><span className="text-gray-500">Owner:</span> {c.ownerId?.name}</p>
                <p className="text-gray-400"><span className="text-gray-500">Address:</span> {c.location?.address || 'N/A'}</p>
              </div>
              
              <button 
                onClick={() => setViewDoc(c.tradeLicense)}
                className="text-primary-400 text-sm hover:underline flex items-center gap-1">
                📄 View Trade License Document
              </button>
            </div>

            {c.status === 'pending' && (
              <div className="flex md:flex-col gap-2 flex-shrink-0">
                <button 
                  onClick={() => handleStatusUpdate(c._id, 'approved')}
                  className="btn-primary py-1.5 px-4 text-sm bg-emerald-600 border-none hover:bg-emerald-500">
                  ✓ Approve
                </button>
                <button 
                  onClick={() => handleStatusUpdate(c._id, 'rejected')}
                  className="btn-secondary py-1.5 px-4 text-sm text-red-500 hover:bg-red-500/10">
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        ))}
        {companies.length === 0 && (
          <div className="text-center py-10 text-gray-400">No applications found.</div>
        )}
      </div>

      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
             onClick={() => setViewDoc(null)}>
          <div className="glass-card w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-white font-bold">Trade License Document</h3>
              <button onClick={() => setViewDoc(null)} className="text-gray-400 hover:text-white">✕ Close</button>
            </div>
            <iframe src={viewDoc} className="flex-1 w-full border-none bg-white rounded-b-xl" title="Trade License" />
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyApproval;
