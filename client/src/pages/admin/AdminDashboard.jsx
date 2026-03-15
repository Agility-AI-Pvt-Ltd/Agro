import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Shared admin API helper with adminToken auth header
 */
const adminApi = (path) =>
  axios.get(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
  });

const AdminLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const navItems = [
    { label: '📊 Dashboard', path: '/admin' },
    { label: '👥 Farmers', path: '/admin/users' },
    { label: '📋 Activity', path: '/admin/activity' },
    { label: '🌾 Crops', path: '/admin/crops' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#1D3D28] to-[#0F2419] text-white min-h-screen py-8 px-6 shadow-2xl">
        <div className="mb-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
            <span className="text-2xl">🛡️</span>
          </div>
          <h2 className="font-bold text-lg">Admin Panel</h2>
          <p className="text-green-300 text-xs">Agri Intelligence Platform</p>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                window.location.pathname === item.path
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto text-left px-4 py-3 rounded-xl text-sm text-red-300 hover:bg-red-500/10 transition"
        >
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          {/* Mobile nav */}
          <div className="flex lg:hidden gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="text-xs text-[#2D5A3D] font-medium px-2 py-1 rounded-lg bg-green-50"
              >
                {item.label.split(' ')[0]}
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="hidden lg:block text-sm text-red-500 hover:underline">
            Logout
          </button>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

// ── Stat Card ──
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="text-3xl font-bold text-gray-800 mb-1">{value ?? '—'}</p>
    <p className="font-medium text-gray-700">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ── Admin Dashboard (Home) ──
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi('/admin/stats')
      .then((res) => {
        if (res.data?.success) setStats(res.data.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        } else {
          toast.error('Failed to load stats');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400 animate-pulse text-lg">Loading statistics…</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon="👨‍🌾"
              label="Total Farmers"
              value={stats?.totalFarmers?.toLocaleString()}
              sub="Registered on platform"
              color="bg-green-50"
            />
            <StatCard
              icon="📅"
              label="Daily Registrations"
              value={stats?.dailyRegistrations}
              sub="New farmers today"
              color="bg-blue-50"
            />
            <StatCard
              icon="⚡"
              label="Active Users"
              value={stats?.activeUsers}
              sub="Active in last 24 hours"
              color="bg-amber-50"
            />
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'View All Farmers', path: '/admin/users', icon: '👥' },
              { label: 'Activity Logs', path: '/admin/activity', icon: '📋' },
              { label: 'Crop Analytics', path: '/admin/crops', icon: '🌾' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all flex items-center gap-3"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-gray-700">{item.label} →</span>
              </button>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export { AdminLayout, adminApi };
export default AdminDashboard;
