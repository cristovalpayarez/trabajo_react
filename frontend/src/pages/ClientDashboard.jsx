import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OrdersList from '../components/OrdersList';
import Carrito from '../components/Carrito';
import PQRSection from '../components/PQRSection';
import FacturasSection from '../components/FacturasSection';
import { API_BASE_URL } from '../config';

const ClientDashboard = () => {
  const { user, updateUser } = useAuth();
  const [showCarrito, setShowCarrito] = useState(false);
  const [activeSection, setActiveSection] = useState('perfil');

  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    direccion: user?.direccion || '',
    telefono: user?.telefono || ''
  });

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    try {
      await updateUser(formData);
      setMensaje('Datos actualizados correctamente.');
    } catch (err) {
      setError(err.message || 'Error al actualizar los datos.');
    }
  };

  return (
    <div className="min-h-screen bg-gaming-dark text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gaming-card border border-neon-blue/40 rounded-2xl p-8 shadow-[0_0_20px_rgba(43,242,251,0.15)]">
          <h1 className="text-3xl font-black mb-2">
            Panel de <span className="text-neon-blue">Cliente</span>
          </h1>
          <p className="text-gray-400 mb-6">Bienvenido a tu espacio personal, {user?.nombre}.</p>

          {/* Tabs de navegación */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
            {[
              { key: 'perfil', label: 'Mi Perfil', icon: '👤' },
              { key: 'pedidos', label: 'Mis Pedidos', icon: '📦' },
              { key: 'carrito', label: 'Mi Carrito', icon: '🛒' },
              { key: 'facturas', label: 'Mis Facturas', icon: '📄' },
              { key: 'pqr', label: 'PQR', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeSection === tab.key
                    ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/40'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenido según pestaña */}
          {activeSection === 'perfil' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gaming-dark/60 border border-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-bold text-neon-purple mb-4">Mis Datos</h2>
                {mensaje && <p className="text-green-400 text-sm mb-3 font-bold">{mensaje}</p>}
                {error && <p className="text-neon-pink text-sm mb-3 font-bold">{error}</p>}
                <p className="text-gray-400 text-sm mb-4">
                  <strong>Correo:</strong> {user?.email} <span className="text-xs">(no editable)</span>
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} maxLength={50} placeholder="Nombre" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-blue" required />
                  <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} maxLength={50} placeholder="Apellido" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-blue" required />
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} maxLength={150} placeholder="Dirección" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-blue" />
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono" className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-blue" />
                  <button type="submit" className="w-full py-3 bg-neon-blue text-black font-bold rounded-lg hover:bg-white transition-all cursor-pointer">
                    Guardar Cambios
                  </button>
                </form>
              </div>
              <div className="bg-gaming-dark/60 border border-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-bold text-neon-blue mb-4">Accesos Rápidos</h2>
                <div className="space-y-3">
                  <button onClick={() => setActiveSection('pedidos')} className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-left hover:border-neon-purple/50 transition">
                    <span className="text-lg">📦</span>
                    <p className="font-bold text-white mt-1">Mis Pedidos</p>
                    <p className="text-xs text-gray-400">Consulta el estado de tus compras</p>
                  </button>
                  <button onClick={() => setActiveSection('facturas')} className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-left hover:border-neon-blue/50 transition">
                    <span className="text-lg">📄</span>
                    <p className="font-bold text-white mt-1">Mis Facturas</p>
                    <p className="text-xs text-gray-400">Descarga tus facturas en PDF</p>
                  </button>
                  <button onClick={() => setActiveSection('pqr')} className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-left hover:border-neon-pink/50 transition">
                    <span className="text-lg">📋</span>
                    <p className="font-bold text-white mt-1">PQR</p>
                    <p className="text-xs text-gray-400">Peticiones, quejas y reclamos</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'pedidos' && (
            <div className="bg-gaming-dark/60 border border-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold text-neon-purple mb-4">📦 Mis Pedidos</h2>
              <OrdersList role="customer" />
            </div>
          )}

          {activeSection === 'carrito' && (
            <div className="bg-gaming-dark/60 border border-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold text-neon-purple mb-4">🛒 Mi Carrito</h2>
              <CarritoResumen onIrAlCarrito={() => setShowCarrito(true)} />
            </div>
          )}

          {activeSection === 'facturas' && (
            <div className="bg-gaming-dark/60 border border-gray-800 p-6 rounded-xl">
              <FacturasSection role="customer" />
            </div>
          )}

          {activeSection === 'pqr' && (
            <div className="bg-gaming-dark/60 border border-gray-800 p-6 rounded-xl">
              <PQRSection role="customer" />
            </div>
          )}
        </div>
      </div>

      <Carrito show={showCarrito} onClose={() => setShowCarrito(false)} />
    </div>
  );
};

const CarritoResumen = ({ onIrAlCarrito }) => {
  const [carrito, setCarrito] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/carrito`, {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (res.ok) {
          setCarrito(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-purple border-t-transparent" />
      </div>
    );
  }

  if (!carrito || carrito.items.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">Tu carrito está vacío</p>
        <p className="text-gray-600 text-xs mt-1">Agrega productos desde la tienda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Productos</span>
        <span className="text-white font-semibold">{carrito.cantidad_total}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Total</span>
        <span className="text-neon-blue font-bold">${carrito.total.toLocaleString('es-CO')}</span>
      </div>
      <button
        onClick={onIrAlCarrito}
        className="mt-2 w-full py-2 bg-neon-purple/20 text-neon-purple font-bold rounded-lg hover:bg-neon-purple/30 transition cursor-pointer text-sm"
      >
        Ir al carrito
      </button>
    </div>
  );
};

export default ClientDashboard;
