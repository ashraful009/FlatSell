import { useState } from 'react';
import useAuth from '../../shared/hooks/useAuth';
import PropertyRequests from '../../features/properties/PropertyRequests';
import BookingManagement from '../../features/bookings/BookingManagement';

const TABS = ['My Properties', 'Bookings / Leads'];

const SellerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="container-main py-10 min-h-screen">
      <div className="glass-card p-6 sm:p-8 mb-8 flex items-center justify-between border-l-4 border-l-blue-500">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Seller Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome agent, {user?.name}</p>
        </div>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-800
                        flex items-center justify-center text-white text-xl font-bold border-2 border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="flex gap-1 mb-8 bg-dark-800/50 p-1.5 rounded-xl w-full max-w-md">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === tab
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'My Properties' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Properties Under You</h2>
            <PropertyRequests mode="company" />
          </div>
        )}

        {activeTab === 'Bookings / Leads' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Customer Bookings & Inquiries</h2>
            <BookingManagement />
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
