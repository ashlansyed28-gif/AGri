import { Link, useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-green-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <span className="text-2xl">🌱</span>
              <span>Crop Advisory AI</span>
            </Link>
            <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
              <Link to="/dashboard" className="hover:text-green-200 transition">
                Dashboard
              </Link>
              <Link to="/plots" className="hover:text-green-200 transition">
                Plots
              </Link>
              {user.full_name && (
                <span className="hidden md:inline-block px-2.5 py-1 bg-green-800 rounded-full text-xs text-green-100">
                  {user.full_name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="bg-green-800 hover:bg-green-900 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        AI-Powered Agriculture Crop Advisory Assistant &bull; Powered by Google Gemini AI
      </footer>
    </div>
  );
}
