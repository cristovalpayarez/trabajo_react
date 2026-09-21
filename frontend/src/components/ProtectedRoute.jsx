import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();

  // ==========================================
  // NO HAY USUARIO
  // ==========================================

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ==========================================
  // EL USUARIO NO TIENE EL ROL NECESARIO
  // ==========================================

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'employee') {
      return <Navigate to="/empleado" replace />;
    }

    return <Navigate to="/" replace />;
  }

  // ==========================================
  // ACCESO PERMITIDO
  // ==========================================

  return children;
};

export default ProtectedRoute;
