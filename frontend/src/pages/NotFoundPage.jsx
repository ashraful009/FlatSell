import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
    <div className="text-center animate-slideUp">
      <p className="text-8xl font-black text-gradient mb-4">404</p>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-gray-400 mb-8">The page you are looking for doesn&apos;t exist.</p>
      <Link to="/" className="btn-primary">← Back to Home</Link>
    </div>
  </div>
);

export default NotFoundPage;
