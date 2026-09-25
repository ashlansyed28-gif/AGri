import { useEffect, useState } from 'react';
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
