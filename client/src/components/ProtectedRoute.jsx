import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user } = useContext(AuthContext);

  // If user is logged in, show child route; otherwise, redirect to /login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;