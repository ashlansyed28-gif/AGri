import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { advisoryRequestSchema } from '../utils/schemas';
import api from '../services/api';

export default function AdvisoryForm() {
  const [searchParams] = useSearchParams();
  const plotId = searchParams.get('plotId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(advisoryRequestSchema),
    defaultValues: {
      plot_id: plotId || '',
      soil_ph: 7.0,
      n_level: 'MEDIUM',
      p_level: 'MEDIUM',
      k_level: 'MEDIUM',
      moisture_percent: 50,
      weather: 'DRY',
      growth_stage: 'VEGETATIVE'
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/advisory/generate', data);
      navigate(`/advisory/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error generating advisory');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow mt-6">
      <h2 className="text-2xl font-bold mb-4">Request AI Crop Advisory</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <input type="hidden" {...register('plot_id')} />
        
        <div>
          <label className="block text-sm font-semibold mb-1">Soil pH</label>
          <input type="number" step="0.1" className="border p-2 rounded w-full" {...register('soil_ph', { valueAsNumber: true })} />
          {errors.soil_ph && <p className="text-red-500 text-sm">{errors.soil_ph.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Moisture %</label>
          <input type="number" className="border p-2 rounded w-full" {...register('moisture_percent', { valueAsNumber: true })} />
          {errors.moisture_percent && <p className="text-red-500 text-sm">{errors.moisture_percent.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Nitrogen (N)</label>
          <select className="border p-2 rounded w-full" {...register('n_level')}>
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Phosphorus (P)</label>
          <select className="border p-2 rounded w-full" {...register('p_level')}>
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Potassium (K)</label>
          <select className="border p-2 rounded w-full" {...register('k_level')}>
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Weather Forecast</label>
          <select className="border p-2 rounded w-full" {...register('weather')}>
            <option value="DRY">Dry</option><option value="RAIN">Rain</option><option value="EXTREME_HEAT">Extreme Heat</option><option value="FROST">Frost</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Growth Stage</label>
          <select className="border p-2 rounded w-full" {...register('growth_stage')}>
            <option value="SEEDLING">Seedling</option><option value="VEGETATIVE">Vegetative</option><option value="FLOWERING">Flowering</option><option value="HARVEST">Harvest</option>
          </select>
        </div>

        <div className="md:col-span-2 mt-4">
          <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded font-bold text-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Analyzing Data...' : 'Generate Advisory'}
          </button>
        </div>
      </form>
    </div>
  );
}
