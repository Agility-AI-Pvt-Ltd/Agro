import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Please enter credentials');

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/admin/login`, { username, password });
      if (res.data?.success) {
        localStorage.setItem('adminToken', res.data.data.adminToken);
        toast.success('Admin login successful');
        navigate('/admin');
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) toast.error('Invalid admin credentials');
      else if (status === 503) toast.error('Admin login not configured on server');
      else toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0F2419] to-[#1D3D28] items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Agricultural Intelligence Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A3D] transition"
              placeholder="Admin username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A3D] transition"
              placeholder="Admin password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-[#2D5A3D] to-[#1D3D28] text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          Restricted access. Authorised personnel only.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
