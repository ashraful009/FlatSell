import { useState } from 'react';
import useAuth           from '../../shared/hooks/useAuth';
import AddPropertyWizard from '../../features/properties/AddPropertyWizard';
import ManageProperties  from '../../features/properties/ManageProperties';
import PropertyRequests  from '../../features/properties/PropertyRequests';
import BookingManagement from '../../features/bookings/BookingManagement';

const TABS = [
  { id: 'manage',  label: '📦 Manage Properties' },
  { id: 'add',     label: '➕ Add Property'       },
  { id: 'pending', label: '📋 My Submissions'     },
  { id: 'bookings',label: '📅 Bookings / Leads'   },
  { id: 'settings',label: '⚙️ Settings'            },
];

const CompanyAdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('manage');

  return (
    <div className="container-main py-10 min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 mb-8 flex items-center justify-between
                      border-l-4 border-l-purple-500">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Company Dashboard</h1>
          <p className="text-gray-400 text-sm truncate max-w-sm">
            Welcome back, {user?.name} (Admin)
          </p>
        </div>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-800
                        flex items-center justify-center text-white text-xl font-bold
                        border-2 border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-8 bg-dark-800/50 p-1.5 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[145px] py-2.5 px-4 rounded-lg text-sm font-medium
              transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="animate-fadeIn">

        {/* Manage Properties */}
        {activeTab === 'manage' && (
          <div>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Manage Properties</h2>
                <p className="text-gray-400 text-sm mt-1">Edit, activate, or delete your own properties</p>
              </div>
              <button onClick={() => setActiveTab('add')} className="btn-primary text-xs py-2 px-4">
                ➕ Add New
              </button>
            </div>
            <ManageProperties mode="company" />
          </div>
        )}

        {/* Add Property */}
        {activeTab === 'add' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Add New Property</h2>
              <p className="text-gray-400 text-sm mt-1">
                Your submission will be reviewed by the admin before going live.
              </p>
            </div>
            <AddPropertyWizard onSuccess={() => setActiveTab('manage')} />
          </div>
        )}

        {/* My Submissions (status tracking) */}
        {activeTab === 'pending' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Submission Status</h2>
            <PropertyRequests mode="company" />
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Customer Bookings & Inquiries</h2>
            <BookingManagement />
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="glass-card p-8 text-center text-gray-400">
            <span className="text-4xl block mb-4">⚙️</span>
            Company settings (Logo upload, name change, seller management) will be placed here.
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;
