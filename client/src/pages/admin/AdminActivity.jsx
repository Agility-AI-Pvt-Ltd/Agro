import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AdminLayout, adminApi } from './AdminDashboard';

const ACTION_COLORS = {
  register: 'bg-green-50 text-green-700',
  login: 'bg-blue-50 text-blue-700',
  logout: 'bg-gray-50 text-gray-600',
  profile_update: 'bg-purple-50 text-purple-700',
  crop_added: 'bg-amber-50 text-amber-700',
  crop_updated: 'bg-orange-50 text-orange-700',
  page_visit: 'bg-slate-50 text-slate-600',
};

const AdminActivity = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchActivity = useCallback((page = 1, action = '') => {
    setLoading(true);
    const query = action ? `?page=${page}&limit=50&action=${action}` : `?page=${page}&limit=50`;
    adminApi(`/admin/activity${query}`)
      .then((res) => {
        if (res.data?.success) {
          setLogs(res.data.data);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          toast.error('Session expired');
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        } else {
          toast.error('Failed to load activity');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => { fetchActivity(1, actionFilter); }, [fetchActivity, actionFilter]);

  const formatTime = (date) =>
    new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <AdminLayout title="Activity Monitoring">
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 flex items-center gap-3 flex-1">
          <span className="text-xl">📋</span>
          <div>
            <p className="font-bold text-gray-700">{pagination.total} Events</p>
            <p className="text-xs text-gray-400">Total activity records</p>
          </div>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); }}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]"
        >
          <option value="">All Actions</option>
          {['register', 'login', 'logout', 'profile_update', 'crop_added', 'crop_updated', 'page_visit'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 animate-pulse">Loading activity…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F0F9F4] border-b border-gray-100">
                  <tr>
                    {['User', 'Action', 'Endpoint', 'Timestamp'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-400">No activity found</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 text-sm">
                            {log.user?.farmerProfile?.name || '—'}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{log.user?.phone || log.userId?.slice(0, 8) + '…'}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-50 text-gray-600'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs font-mono max-w-[200px] truncate">
                          {log.endpoint || '—'}
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {formatTime(log.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchActivity(pagination.page - 1, actionFilter)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchActivity(pagination.page + 1, actionFilter)}
                  className="px-4 py-2 rounded-lg bg-[#2D5A3D] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#1D3D28] transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminActivity;
