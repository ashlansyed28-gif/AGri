import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Plots() {
  const [plots, setPlots] = useState([]);
  
  useEffect(() => {
    api.get('/plots').then(res => setPlots(res.data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Plots</h1>
        <Link to="/plots/new" className="bg-green-600 text-white px-4 py-2 rounded">Add New Plot</Link>
      </div>
      <div className="bg-white rounded shadow p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Crop</th>
              <th className="p-2">Acreage</th>
              <th className="p-2">Region</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plots.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{p.plot_name}</td>
                <td className="p-2">{p.crop_type}</td>
                <td className="p-2">{p.acreage}</td>
                <td className="p-2">{p.region}</td>
                <td className="p-2">
                  <Link to={`/plots/${p.id}`} className="text-blue-600 mr-2">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
