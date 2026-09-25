import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    api
      .get('/plots')
      .then((res) => setPlots(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.error || err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back{user.full_name ? `, ${user.full_name}` : ''}!
          </h1>
          <p className="text-gray-500 mt-1">Manage your farm plots and generate AI crop advisories.</p>
        </div>
        <Link
          to="/plots/new"
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow transition-colors"
        >
          + Add New Plot
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
          <strong>Notice: </strong> {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Farm Plots</h3>
          <p className="text-3xl font-extrabold text-green-700 mt-2">{plots.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Acreage</h3>
          <p className="text-3xl font-extrabold text-blue-700 mt-2">
            {plots.reduce((acc, p) => acc + (parseFloat(p.acreage) || 0), 0).toFixed(1)} <span className="text-base font-normal text-gray-400">acres</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">AI Engine Status</h3>
          <div className="flex items-center gap-2 mt-3">
            <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-gray-700">Gemini 2.5 Active</span>
          </div>
        </div>
      </div>

      {/* Plots List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Farm Plots</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl">Loading plots...</div>
        ) : plots.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No farm plots registered yet</h3>
            <p className="text-gray-500 text-sm mb-4">Add your first plot to start tracking soil metrics and getting AI advisories.</p>
            <Link
              to="/plots/new"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Add Your First Plot
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plots.map((plot) => (
              <div
                key={plot.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow border-l-4 border-l-green-600 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{plot.plot_name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-700">Crop:</span> {plot.crop_type}</p>
                    <p><span className="font-medium text-gray-700">Size:</span> {plot.acreage} acres</p>
                    <p><span className="font-medium text-gray-700">Region:</span> {plot.region}</p>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t flex justify-between items-center text-sm font-medium">
                  <Link to={`/plots/${plot.id}`} className="text-blue-600 hover:underline">
                    View History
                  </Link>
                  <Link
                    to={`/advisory/new?plotId=${plot.id}`}
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded-md transition"
                  >
                    AI Advisory
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
