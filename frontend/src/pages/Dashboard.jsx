import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [plots, setPlots] = useState([]);
  
  useEffect(() => {
    api.get('/plots').then(res => setPlots(res.data)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 shadow rounded">
          <h3 className="text-xl font-semibold text-gray-700">Total Plots</h3>
          <p className="text-3xl text-green-700 font-bold">{plots.length}</p>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Your Plots</h2>
        <Link to="/plots/new" className="bg-green-600 text-white px-4 py-2 rounded">Add New Plot</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plots.map(plot => (
          <div key={plot.id} className="bg-white p-4 rounded shadow border-l-4 border-green-500">
            <h3 className="font-bold text-lg">{plot.plot_name}</h3>
            <p className="text-gray-600">{plot.crop_type} - {plot.acreage} acres</p>
            <div className="mt-4 flex gap-2">
              <Link to={`/plots/${plot.id}`} className="text-blue-600 hover:underline">View Details</Link>
              <Link to={`/advisory/new?plotId=${plot.id}`} className="text-green-600 hover:underline">Get Advisory</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
