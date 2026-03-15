import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AdminLayout, adminApi } from './AdminDashboard';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback((page = 1) => {
    setLoading(true);
    adminApi(`/admin/users?page=${page}&limit=20`)
      .then((res) => {
        if (res.data?.success) {
          setUsers(res.data.data);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          toast.error('Session expired');
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        } else {
          toast.error('Failed to load farmers');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const formatLocation = (u) => {
    const lat = u.farmerProfile?.locationLat;
    const lng = u.farmerProfile?.locationLng;
    const addr = u.farmerProfile?.address;
    if (addr) return addr;
    if (lat && lng) return `${parseFloat(lat).toFixed(2)}°, ${parseFloat(lng).toFixed(2)}°`;
    return '—';
  };

  return (
    <AdminLayout title="Farmers Management">
      {/* Stats bar */}
      <div className="mb-6 bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-100 flex items-center gap-4">
        <span className="text-2xl">👥</span>
        <div>
          <p className="font-bold text-gray-800 text-lg">{pagination.total} Farmers</p>
          <p className="text-sm text-gray-400">Page {pagination.page} of {pagination.totalPages}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 animate-pulse">Loading farmers…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F0F9F4] border-b border-gray-100">
                  <tr>
                    {['#', 'Name', 'Phone', 'Location', 'Status', 'Registered'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">No farmers found</td>
                    </tr>
                  ) : (
                    users.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {(pagination.page - 1) * 20 + idx + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(u.farmerProfile?.name || u.phone)?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-800">{u.farmerProfile?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 font-mono">{u.phone}</td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{formatLocation(u)}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
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
                  onClick={() => fetchUsers(pagination.page - 1)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
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

export default AdminUsers;
