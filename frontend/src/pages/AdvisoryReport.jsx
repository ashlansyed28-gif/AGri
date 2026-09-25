import { useEffect, useState } from 'react';
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
