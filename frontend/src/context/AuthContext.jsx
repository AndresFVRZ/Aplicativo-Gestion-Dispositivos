import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    if (tokenGuardado) {
      verificarToken(tokenGuardado);
    } else {
      setCargando(false);
    }
  }, []);

  const verificarToken = async (tokenGuardado) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${tokenGuardado}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsuario(data.usuario);
        setToken(tokenGuardado);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error verificando token:', error);
    } finally {
      setCargando(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setUsuario(data.usuario);
        setToken(data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUsuario(null);
    setToken(null);
  };

  const tienePermiso = (rolesPermitidos) => {
    if (!usuario) return false;
    return rolesPermitidos.includes(usuario.rol);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
};