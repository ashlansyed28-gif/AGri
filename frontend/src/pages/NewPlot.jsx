import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NewPlot() {
  const [formData, setFormData] = useState({ plot_name: '', crop_type: '', acreage: '', region: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/plots', { ...formData, acreage: parseFloat(formData.acreage) });
      navigate('/plots');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create plot');
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow mt-10">
      <h2 className="text-2xl font-bold mb-4">Register New Plot</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Plot Name</label>
          <input className="border p-2 rounded w-full" required value={formData.plot_name} onChange={e => setFormData({...formData, plot_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Crop Type</label>
          <input className="border p-2 rounded w-full" required value={formData.crop_type} onChange={e => setFormData({...formData, crop_type: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Acreage</label>
          <input type="number" step="0.01" className="border p-2 rounded w-full" required value={formData.acreage} onChange={e => setFormData({...formData, acreage: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Region</label>
          <input className="border p-2 rounded w-full" required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
        </div>
        <button className="bg-green-600 text-white py-2 rounded font-semibold mt-2">Save Plot</button>
      </form>
    </div>
  );
}
