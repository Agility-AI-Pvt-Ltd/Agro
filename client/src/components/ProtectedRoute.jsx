import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — requires a valid accessToken in localStorage.
 * If no token, redirects to /get-started.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/get-started" replace />;
  }
  return children;
};

export default ProtectedRoute;
