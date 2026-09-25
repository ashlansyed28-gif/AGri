import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function AdvisoryReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/advisory/${id}`)
      .then((res) => setReport(res.data))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load advisory report.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-gray-500">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mb-3"></div>
        <p>Loading AI Advisory Report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-red-600 mb-4">{error || 'Advisory report not found.'}</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Safe parsing for both JSONB object or string representation
  let data = report.ai_recommendation_json;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = { summary: data, fertilizer_plan: [], irrigation_plan: [], risk_warnings: [] };
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">AI Crop Advisory Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generated on {new Date(report.created_at).toLocaleString()} &bull; Growth Stage: <span className="font-semibold text-gray-700">{report.growth_stage}</span>
          </p>
        </div>
        <Link
          to={`/plots/${report.plot_id}`}
          className="text-sm font-semibold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition"
        >
          &larr; Back to Plot
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Conditions Summary Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-xs text-gray-400 font-medium uppercase">Soil pH</span>
            <p className="text-lg font-bold text-gray-800">{report.soil_ph}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium uppercase">Moisture</span>
            <p className="text-lg font-bold text-gray-800">{report.moisture_percent}%</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium uppercase">N-P-K Levels</span>
            <p className="text-lg font-bold text-gray-800">
              {report.n_level}-{report.p_level}-{report.k_level}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium uppercase">Forecast</span>
            <p className="text-lg font-bold text-gray-800">{report.weather}</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Executive Summary */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>📋</span> Agronomic Health Summary
            </h2>
            <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">
              {data.summary}
            </p>
          </div>

          {/* Action Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50/70 border border-green-200 rounded-xl p-5">
              <h3 className="font-bold text-green-900 mb-3 text-lg flex items-center gap-2">
                <span>🌱</span> Fertilizer & Nutrient Plan
              </h3>
              <ul className="space-y-2.5">
                {data.fertilizer_plan?.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5">
              <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
                <span>💧</span> Irrigation & Water Management
              </h3>
              <ul className="space-y-2.5">
                {data.irrigation_plan?.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk Mitigation */}
          {data.risk_warnings && data.risk_warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-bold text-amber-900 mb-3 text-lg flex items-center gap-2">
                <span>⚠️</span> Risk Factors & Pest/Disease Mitigation
              </h3>
              <ul className="space-y-2">
                {data.risk_warnings.map((item, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-0.5">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
