import os

base_dir = 'c:/antigravity google/agriculture-assistant/frontend'

def w(path, content):
    with open(f'{base_dir}/{path}', 'w', encoding='utf-8') as f:
        f.write(content)


w('src/components/Layout.jsx', '''import { Link, useNavigate } from 'react-router-dom';

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
''')

w('src/components/AuthForm.jsx', '''import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        await api.post('/auth/register', formData);
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <input type="text" placeholder="Full Name" className="border p-2 rounded" 
            value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
        )}
        <input type="email" placeholder="Email" className="border p-2 rounded"
          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input type="password" placeholder="Password" className="border p-2 rounded"
          value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
        <button className="bg-green-600 text-white py-2 rounded font-semibold">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-green-700 mt-4 underline">
        {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
      </button>
    </div>
  );
}
''')

w('src/pages/Home.jsx', '''import AuthForm from '../components/AuthForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-green-800 mb-2">AI Crop Advisory Assistant</h1>
        <p className="text-gray-600 max-w-lg mx-auto">Get real-time, highly optimized, AI-driven agricultural advisory reports for your farm plots.</p>
      </div>
      <AuthForm />
    </div>
  );
}
''')

w('src/pages/Dashboard.jsx', '''import { useEffect, useState } from 'react';
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
''')

w('src/pages/Plots.jsx', '''import { useEffect, useState } from 'react';
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
''')

w('src/pages/NewPlot.jsx', '''import { useState } from 'react';
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
''')

w('src/pages/PlotDetail.jsx', '''import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function PlotDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/plots/${id}`).then(res => setData(res.data)).catch(console.error);
  }, [id]);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{data.plot_name} Details</h1>
        <Link to={`/advisory/new?plotId=${data.id}`} className="bg-green-600 text-white px-4 py-2 rounded">Get New Advisory</Link>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <p><strong>Crop:</strong> {data.crop_type}</p>
        <p><strong>Acreage:</strong> {data.acreage}</p>
        <p><strong>Region:</strong> {data.region}</p>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Advisory History</h2>
      {data.advisories?.length === 0 ? (
        <p className="text-gray-500">No advisories yet.</p>
      ) : (
        <div className="grid gap-4">
          {data.advisories.map(adv => (
            <div key={adv.id} className="bg-white p-4 rounded shadow">
              <p className="text-sm text-gray-500">{new Date(adv.created_at).toLocaleDateString()}</p>
              <p className="font-bold">Growth Stage: {adv.growth_stage}</p>
              <Link to={`/advisory/${adv.id}`} className="text-blue-600 hover:underline">View Report</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
''')

w('src/pages/AdvisoryForm.jsx', '''import { useState } from 'react';
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
''')

w('src/pages/AdvisoryReport.jsx', '''import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function AdvisoryReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  
  useEffect(() => {
    api.get(`/advisory/${id}`).then(res => setReport(res.data)).catch(console.error);
  }, [id]);

  if (!report) return <div>Loading...</div>;

  const data = report.ai_recommendation_json;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Advisory Report</h1>
        <Link to={`/plots/${report.plot_id}`} className="text-blue-600 hover:underline">Back to Plot</Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-6 pb-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Summary</h2>
          <p className="text-gray-600 leading-relaxed">{data.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <h3 className="font-bold text-green-800 mb-3 text-lg">Fertilizer Plan</h3>
            <ul className="list-disc pl-5 space-y-2">
              {data.fertilizer_plan.map((item, i) => <li key={i} className="text-gray-700">{item}</li>)}
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-3 text-lg">Irrigation Plan</h3>
            <ul className="list-disc pl-5 space-y-2">
              {data.irrigation_plan.map((item, i) => <li key={i} className="text-gray-700">{item}</li>)}
            </ul>
          </div>
        </div>

        {data.risk_warnings && data.risk_warnings.length > 0 && (
          <div className="bg-red-50 p-4 rounded border border-red-200">
            <h3 className="font-bold text-red-800 mb-3 text-lg">Risk Warnings</h3>
            <ul className="list-disc pl-5 space-y-2">
              {data.risk_warnings.map((item, i) => <li key={i} className="text-red-700">{item}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
''')

print("Frontend React components created!")
