import { Link, useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-green-700 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-xl font-bold">Crop Advisory Assistant</Link>
          <div className="flex gap-4">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/plots" className="hover:underline">Plots</Link>
            <button onClick={handleLogout} className="bg-green-800 px-3 py-1 rounded">Logout</button>
          </div>
        </div>
      </nav>
      <main className="flex-1 container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
