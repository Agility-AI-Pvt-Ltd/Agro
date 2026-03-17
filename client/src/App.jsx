import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

import GetStarted from './pages/GetStarted';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Chatbot from './pages/Chatbot';
import UnderDevelopment from './pages/UnderDevelopment';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminActivity from './pages/admin/AdminActivity';
import AdminCrops from './pages/admin/AdminCrops';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Pre-emptively refresh if it expires in less than 30 seconds
    return payload.exp * 1000 < (Date.now() + 30000);
  } catch (e) {
    return true;
  }
};

/**
 * Root redirect — checks auth state and routes accordingly.
 *  - Has valid accessToken → /home
 *  - No token            → /get-started
 */
const RootRedirect = () => {
  const token = localStorage.getItem('accessToken');
  return <Navigate to={token && !isTokenExpired(token) ? '/home' : '/get-started'} replace />;
};

/**
 * GetStarted wrapper — if already logged in redirect to /home immediately.
 */
const GetStartedGuard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !isTokenExpired(token)) navigate('/home', { replace: true });
  }, [navigate]);
  return <GetStarted />;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        setIsInitializing(false);
        return;
      }

      if (!isTokenExpired(accessToken)) {
        setIsInitializing(false);
        return;
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        if (res.data?.success) {
          localStorage.setItem('accessToken', res.data.data.accessToken);
          localStorage.setItem('refreshToken', res.data.data.refreshToken);
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  if (isInitializing) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-[#F0F9F4] w-full">
         <div className="w-8 h-8 rounded-full border-4 border-[#2D5A3D] border-t-transparent animate-spin"></div>
       </div>
     );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Root → smart redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public auth routes */}
        <Route path="/get-started" element={<GetStartedGuard />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected farmer routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
        <Route path="/under-development" element={<ProtectedRoute><UnderDevelopment /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/activity" element={<AdminRoute><AdminActivity /></AdminRoute>} />
        <Route path="/admin/crops" element={<AdminRoute><AdminCrops /></AdminRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;