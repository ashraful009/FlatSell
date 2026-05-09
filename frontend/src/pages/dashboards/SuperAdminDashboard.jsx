import { useState } from 'react';
import useAuth            from '../../shared/hooks/useAuth';
import AddPropertyWizard  from '../../features/properties/AddPropertyWizard';
import ManageProperties   from '../../features/properties/ManageProperties';
import PropertyRequests   from '../../features/properties/PropertyRequests';
import CompanyApproval    from '../../features/companies/CompanyApproval';
import MarginTracking     from '../../features/commissions/MarginTracking';
import SalesReport        from '../../features/bookings/SalesReport';

const TABS = [
  { id: 'pending',   label: '⏳ Pending Properties'  },
  { id: 'manage',    label: '📦 Manage All'           },
  { id: 'add',       label: '➕ Add Property'         },
  { id: 'companies', label: '🏢 Company Applications' },
  { id: 'margin',    label: '💰 Revenue & Margin'     },
  { id: 'sales',     label: '📈 Sales Report'         },
  { id: 'settings',  label: '⚙️ Platform Settings'   },
];


const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <div className="container-main py-10 min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 mb-8 flex items-center justify-between
                      border-l-4 border-l-primary-500">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Super Admin Console</h1>
          <p className="text-gray-400 text-sm">Welcome back, {user?.name}</p>
        </div>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-800
                        flex items-center justify-center text-white text-xl font-bold
                        border-2 border-white/10 shadow-glow">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-8 bg-dark-800/50 p-1.5 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[155px] py-2.5 px-4 rounded-lg text-sm font-medium
              transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="animate-fadeIn">

        {/* Pending Properties (approval queue) */}
        {activeTab === 'pending' && (
          <div>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Property Approval Queue</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Review and approve / reject vendor-submitted properties
                </p>
              </div>
            </div>
            <PropertyRequests mode="admin" />
          </div>
        )}

        {/* Manage All Properties */}
        {activeTab === 'manage' && (
          <div>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Manage All Properties</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Edit, activate/deactivate, or delete any property
                </p>
              </div>
              <button onClick={() => setActiveTab('add')} className="btn-primary text-xs py-2 px-4">
                ➕ Add Property
              </button>
            </div>
            <ManageProperties mode="admin" />
          </div>
        )}

        {/* Add Property (Super Admin → auto-approved) */}
        {activeTab === 'add' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Add New Property</h2>
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-green-500/10 border
                              border-green-500/25 rounded-xl w-fit">
                <span className="text-green-400 text-sm">⚡</span>
                <p className="text-green-400 text-sm font-medium">
                  Super Admin properties are auto-published immediately.
                </p>
              </div>
            </div>
            <AddPropertyWizard onSuccess={() => setActiveTab('manage')} />
          </div>
        )}

        {/* Company Applications */}
        {activeTab === 'companies' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Vendor Applications</h2>
            <CompanyApproval />
          </div>
        )}

        {/* Revenue & Margin */}
        {activeTab === 'margin' && (
          <MarginTracking />
        )}

        {/* Sales Report */}
        {activeTab === 'sales' && (
          <SalesReport mode="admin" />
        )}

        {/* Platform Settings */}
        {activeTab === 'settings' && (
          <div className="glass-card p-8 text-center text-gray-400">
            <span className="text-4xl block mb-4">⚙️</span>
            General platform settings will be placed here in the future.
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
