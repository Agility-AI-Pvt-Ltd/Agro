import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AdminLayout, adminApi } from './AdminDashboard';

// Simple bar chart using CSS only
const BarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.cropType} className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-700 w-28 truncate capitalize">{item.cropType}</p>
          <div className="flex-1 h-8 bg-[#F0F9F4] rounded-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2D5A3D] to-[#7ED957] rounded-lg transition-all duration-700 flex items-center pr-3"
              style={{ width: `${Math.max((item.count / max) * 100, 5)}%` }}
            >
              <span className="text-white text-xs font-bold ml-auto">{item.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const STATUS_COLORS = {
  growing: 'bg-green-100 text-green-700 border-green-200',
  harvested: 'bg-amber-100 text-amber-700 border-amber-200',
  failed: 'bg-red-100 text-red-600 border-red-200',
  planned: 'bg-blue-100 text-blue-700 border-blue-200',
};

const AdminCrops = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi('/admin/crops')
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          toast.error('Session expired');
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        } else {
          toast.error('Failed to load crop data');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const totalCrops = data?.byType?.reduce((s, c) => s + c.count, 0) || 0;

  return (
    <AdminLayout title="Crop Analytics">
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">Loading analytics…</div>
      ) : (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <span className="text-3xl">🌾</span>
            <div>
              <p className="text-3xl font-bold text-gray-800">{totalCrops}</p>
              <p className="text-sm text-gray-500">Total crop records across {data?.byType?.length} types</p>
            </div>
          </div>

          {/* Distribution by crop type */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg mb-6">Crop Type Distribution</h2>
            {data?.byType?.length > 0 ? (
              <BarChart data={data.byType} />
            ) : (
              <p className="text-gray-400 text-center py-8">No crop data available</p>
            )}
          </div>

          {/* Status breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg mb-6">Crop Status Breakdown</h2>
            {data?.byStatus?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.byStatus.map((s) => (
                  <div
                    key={s.status}
                    className={`rounded-2xl border p-4 text-center ${STATUS_COLORS[s.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
                  >
                    <p className="text-3xl font-bold mb-1">{s.count}</p>
                    <p className="text-sm font-medium capitalize">{s.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No status data available</p>
            )}
          </div>

          {/* Top 5 table */}
          {data?.byType?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 text-lg mb-4">Top Crops</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Crop</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Count</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.byType.slice(0, 10).map((item, idx) => (
                    <tr key={item.cropType} className="hover:bg-gray-50">
                      <td className="py-3 px-3 text-gray-400 text-xs font-bold">#{idx + 1}</td>
                      <td className="py-3 px-3 font-medium text-gray-700 capitalize">{item.cropType}</td>
                      <td className="py-3 px-3 text-right font-bold text-[#2D5A3D]">{item.count}</td>
                      <td className="py-3 px-3 text-right text-gray-400">
                        {totalCrops > 0 ? `${((item.count / totalCrops) * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCrops;
