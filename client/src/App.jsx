import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import GetStarted from './pages/GetStarted';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import UnderDevelopment from './pages/UnderDevelopment';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminActivity from './pages/admin/AdminActivity';
import AdminCrops from './pages/admin/AdminCrops';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

/**
 * Root redirect — checks auth state and routes accordingly.
 *  - Has valid accessToken → /home
 *  - No token            → /get-started
 */
const RootRedirect = () => {
  const token = localStorage.getItem('accessToken');
  return <Navigate to={token ? '/home' : '/get-started'} replace />;
};

/**
 * GetStarted wrapper — if already logged in redirect to /home immediately.
 */
const GetStartedGuard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) navigate('/home', { replace: true });
  }, [navigate]);
  return <GetStarted />;
};

function App() {
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