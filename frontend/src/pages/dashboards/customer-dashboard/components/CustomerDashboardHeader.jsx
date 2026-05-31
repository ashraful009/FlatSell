import React from 'react';
import { Link } from 'react-router-dom';

const CustomerDashboardHeader = ({ user }) => {
  return (
    <div className="glass-card p-6 sm:p-8 mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
      </div>
      <div className="flex gap-4">
        <Link
          to="/customer-dashboard/my-properties"
          className="btn-primary flex items-center h-10 px-4 text-sm font-semibold"
        >
          My Properties
        </Link>
        <div
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-800
                     flex items-center justify-center text-white text-xl font-bold border-2 border-blue-100"
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardHeader;
