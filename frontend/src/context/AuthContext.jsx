import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const API_URL = 'http://127.0.0.1:8000/api/auth';

const normalizeUser = (data = {}) => {
  const rawRole = String(data.rol || '').toLowerCase().trim();
  const role = ['admin', 'administrador'].includes(rawRole)
    ? 'admin'
    : ['empleado', 'vendedor'].includes(rawRole)
      ? 'employee'
      : 'customer';

  return {
    ...data,
    email: data.correo || data.email,
    role,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('El correo y la contraseña son obligatorios.');
    }

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email.trim(), password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.mensaje || 'Correo o contraseña incorrectos.');
    }

    const usuario = normalizeUser(data.usuario);
    setUser(usuario);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(usuario));
    return usuario;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = async (datos) => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://127.0.0.1:8000/api/usuarios/perfil', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(datos),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.mensaje || 'No se pudieron actualizar los datos.');
    }

    const updated = normalizeUser({ ...user, ...data.usuario });
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error recuperando sesion:', error);
        logout();
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
