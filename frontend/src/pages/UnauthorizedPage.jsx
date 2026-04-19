import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
    <div className="text-center animate-slideUp">
      <p className="text-7xl mb-4">🔒</p>
      <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
      <p className="text-gray-400 mb-8">You don&apos;t have permission to view this page.</p>
      <Link to="/" className="btn-primary">← Back to Home</Link>
    </div>
  </div>
);

export default UnauthorizedPage;
