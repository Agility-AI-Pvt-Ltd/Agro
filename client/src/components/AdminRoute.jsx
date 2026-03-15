import { Navigate } from 'react-router-dom';

/**
 * AdminRoute — requires a valid adminToken in localStorage with role=admin.
 * If not present, redirects to /admin/login.
 */
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default AdminRoute;
