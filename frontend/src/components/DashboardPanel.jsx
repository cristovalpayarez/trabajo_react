import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';

import OrdersList from './OrdersList';
import Carrito from './Carrito';
import Notification from './Notification';
import DashboardCards from './DashboardCards';
import VentasChart from './VentasChart';
import VentasSection from './VentasSection';
import FacturasSection from './FacturasSection';
import PQRSection from './PQRSection';
import ReportesSection from './ReportesSection';
import ClientViewSection from './ClientViewSection';
import NexusLogo from './NexusLogo';
import AdminTopBar from './AdminTopBar';
import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

const normalizeUserRole = (rol) => {
  const raw = String(rol || '').toLowerCase().trim();
  if (['admin', 'administrador'].includes(raw)) return 'admin';
  if (['empleado', 'vendedor'].includes(raw)) return 'employee';
  return 'customer';
};

// Menú idéntico en los dos paneles: así el del empleado y el del
// administrador tienen exactamente la misma estructura y diseño.
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Inicio', icon: '🏠' },
  { key: 'users', label: 'Usuarios', icon: '👥' },
  { key: 'products', label: 'Productos', icon: '📦' },
  { key: 'orders', label: 'Pedidos', icon: '🛒' },
  { key: 'ventas', label: 'Ventas', icon: '💰' },
  { key: 'facturas', label: 'Facturas', icon: '📄' },
  { key: 'reportes', label: 'Reportes', icon: '📊' },
  { key: 'pqr', label: 'PQR', icon: '📋' },
  { key: 'vista-usuario', label: 'Vista de usuario', icon: '🧑‍💻' },
];

// Menú específico del cliente: mismo diseño que los paneles internos,
// pero solo con las funciones que le corresponden.
const CUSTOMER_NAV_ITEMS = [
  { key: 'dashboard', label: 'Inicio', icon: '🏠' },
  { key: 'orders', label: 'Mis Pedidos', icon: '📦' },
  { key: 'cart', label: 'Mi Carrito', icon: '🛒' },
  { key: 'facturas', label: 'Mis Facturas', icon: '📄' },
  { key: 'pqr', label: 'PQR', icon: '📋' },
];

const ROLE_TEXTS = {
  admin: {
    title: 'Bienvenido, Administrador',
    subtitle: 'Panel de administración de la tienda tecnológica',
    topBar: 'Logueado como Administrador',
    gradientId: 'admin-side',
  },
  employee: {
    title: 'Bienvenido, Empleado',
    subtitle: 'Panel de gestión comercial de la tienda tecnológica',
    topBar: 'Logueado como Empleado',
    gradientId: 'emp-side',
  },
  customer: {
    title: 'Bienvenido, Cliente',
    subtitle: 'Tu espacio personal en NEXUS TECH',
    topBar: 'Logueado como Cliente',
    gradientId: 'customer-side',
  },
};

/**
 * Panel compartido por los roles administrador y empleado.
 * Ambos ven exactamente las mismas secciones y el mismo diseño; lo único que
 * cambia son las acciones reservadas al administrador (cambiar roles,
 * eliminar usuarios y crear empleados).
 */
const DashboardPanel = ({ role = 'admin' }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();

  const esAdmin = role === 'admin';
  const esCliente = role === 'customer';
  const textos = ROLE_TEXTS[role] || ROLE_TEXTS.admin;

  const [activeSection, setActiveSection] = useState('dashboard');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    image: '',
    tag: '',
  });

  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);

  const [showCarrito, setShowCarrito] = useState(false);
  const [perfilForm, setPerfilForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    direccion: user?.direccion || '',
    telefono: user?.telefono || '',
  });
  const [perfilMensaje, setPerfilMensaje] = useState('');
  const [perfilError, setPerfilError] = useState('');

  const showNotification = (type, message) => setNotification({ type, message });

  const cargarUsuarios = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/usuarios`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al cargar usuarios');
      }

      setUsers(
        (data.usuarios || []).map((item) => ({
          ...item,
          id: Number(item.id),
          name: `${item.nombre} ${item.apellido || ''}`.trim(),
          email: item.correo,
          role: normalizeUserRole(item.rol),
          status: item.estado || 'Activo',
        }))
      );
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showNotification('error', 'No se pudieron cargar los usuarios del panel.');
    }
  };

  useEffect(() => {
    if (role !== 'customer') {
      cargarUsuarios();
    }
  }, [role]);

  const handleUserStatus = async (userItem) => {
    const token = localStorage.getItem('token');
    const estado = userItem.status === 'Activo' ? 'Inactivo' : 'Activo';

    const response = await fetch(`${API_URL}/api/usuarios/${userItem.id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ estado }),
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification('error', data.mensaje || 'No se pudo cambiar el estado.');
      return;
    }

    setUsers((current) =>
      current.map((item) => (item.id === userItem.id ? { ...item, status: estado } : item))
    );

    showNotification(
      'success',
      `Usuario ${estado === 'Activo' ? 'activado' : 'desactivado'} correctamente.`
    );
  };

  const handleRoleChange = async (userItem, nuevoRol) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/usuarios/${userItem.id}/rol`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ rol: nuevoRol }),
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification('error', data.mensaje || 'No se pudo cambiar el rol.');
        return;
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === userItem.id
            ? { ...item, rol: nuevoRol, role: normalizeUserRole(nuevoRol) }
            : item
        )
      );

      showNotification('success', `Rol de ${userItem.name} actualizado a ${nuevoRol}.`);
    } catch (error) {
      showNotification('error', error.message || 'No se pudo cambiar el rol.');
    }
  };

  const handleDeleteUser = async (userItem) => {
    const shouldDelete = window.confirm(
      `¿Eliminar a ${userItem.name}? También se eliminarán sus pedidos.`
    );

    if (!shouldDelete) return;

    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/usuarios/${userItem.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification('error', data.mensaje || 'No se pudo eliminar el usuario.');
      return;
    }

    setUsers((current) => current.filter((item) => item.id !== userItem.id));
    showNotification('success', 'Usuario eliminado correctamente.');
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetProductForm = () => {
    setProductForm({ name: '', category: '', price: '', image: '', tag: '' });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    if (
      !productForm.name ||
      !productForm.category ||
      !productForm.price ||
      !productForm.image ||
      !productForm.tag
    ) {
      showNotification('error', 'Completa todos los campos del producto.');
      return;
    }

    const productToSave = { ...productForm, price: Number(productForm.price) };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productToSave);
        showNotification('success', 'Producto actualizado correctamente.');
      } else {
        await addProduct(productToSave);
        showNotification('success', 'Producto agregado correctamente.');
      }
      resetProductForm();
    } catch (error) {
      showNotification('error', error.message || 'No se pudo guardar el producto.');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      tag: product.tag,
    });
    setShowProductForm(true);
    setActiveSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = (id) => {
    const product = products.find((item) => item.id === id);
    setPendingDeleteProduct(product || { id });
  };

  const confirmDeleteProduct = async () => {
    if (!pendingDeleteProduct) return;

    try {
      await deleteProduct(pendingDeleteProduct.id);
      showNotification('success', 'Producto eliminado correctamente.');
    } catch (error) {
      showNotification('error', error.message || 'No se pudo eliminar el producto.');
    } finally {
      setPendingDeleteProduct(null);
    }
  };

  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    navigate('/login');
  };

  const handlePerfilChange = (e) => {
    const { name, value } = e.target;
    setPerfilForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePerfilSubmit = async (e) => {
    e.preventDefault();
    setPerfilMensaje('');
    setPerfilError('');

    if (typeof updateUser !== 'function') {
      setPerfilError('No se pudo actualizar los datos.');
      return;
    }

    try {
      await updateUser(perfilForm);
      setPerfilMensaje('Datos actualizados correctamente.');
    } catch (err) {
      setPerfilError(err.message || 'Error al actualizar los datos.');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Activo':
      case 'Entregado':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Pendiente':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Procesando':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Enviado':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
      case 'Inactivo':
      case 'Cancelado':
      case 'Cancelada':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  if (user && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  // ============================================================
  // SECCIONES
  // ============================================================

  const renderDashboard = () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Panel</p>
        <h1 className="mt-2 text-4xl font-black text-white">{textos.title}</h1>
        <p className="mt-1 text-slate-400">{textos.subtitle}</p>
      </div>

      <DashboardCards role={role} onNavigate={setActiveSection} />

      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(15,23,42,0.45)]">
        <h2 className="mb-4 text-xl font-bold text-white">Gráficos de Ventas</h2>
        <VentasChart />
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(15,23,42,0.45)]">
        <h2 className="mb-4 text-xl font-bold text-white">Resumen rápido</h2>
        <OrdersList role={role} />
      </div>
    </div>
  );

  const renderCustomerHome = () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Panel</p>
        <h1 className="mt-2 text-4xl font-black text-white">{textos.title}</h1>
        <p className="mt-1 text-slate-400">{textos.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
          <h2 className="mb-4 text-xl font-bold text-white">Mis Datos</h2>
          {perfilMensaje && (
            <p className="mb-3 text-sm font-bold text-emerald-400">{perfilMensaje}</p>
          )}
          {perfilError && <p className="mb-3 text-sm font-bold text-rose-400">{perfilError}</p>}
          <p className="mb-4 text-sm text-slate-400">
            <strong>Correo:</strong> {user?.email || '—'}{' '}
            <span className="text-xs">(no editable)</span>
          </p>
          <form onSubmit={handlePerfilSubmit} className="space-y-3">
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Nombre
              <input
                type="text"
                name="nombre"
                value={perfilForm.nombre}
                onChange={handlePerfilChange}
                maxLength={50}
                required
                className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Apellido
              <input
                type="text"
                name="apellido"
                value={perfilForm.apellido}
                onChange={handlePerfilChange}
                maxLength={50}
                required
                className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Dirección
              <input
                type="text"
                name="direccion"
                value={perfilForm.direccion}
                onChange={handlePerfilChange}
                maxLength={150}
                placeholder="Dirección de envío"
                className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Teléfono
              <input
                type="text"
                name="telefono"
                value={perfilForm.telefono}
                onChange={handlePerfilChange}
                placeholder="Teléfono de contacto"
                className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Guardar Cambios
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-violet-500/20 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(139,92,246,0.08)]">
            <h2 className="mb-4 text-xl font-bold text-white">Accesos Rápidos</h2>
            <div className="space-y-3">
              <button
                onClick={() => setActiveSection('orders')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-left transition hover:border-cyan-400/50"
              >
                <span className="text-lg">📦</span>
                <p className="mt-1 font-bold text-white">Mis Pedidos</p>
                <p className="text-xs text-slate-400">Consulta el estado de tus compras</p>
              </button>
              <button
                onClick={() => setActiveSection('cart')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-left transition hover:border-cyan-400/50"
              >
                <span className="text-lg">🛒</span>
                <p className="mt-1 font-bold text-white">Mi Carrito</p>
                <p className="text-xs text-slate-400">Revisa y finaliza tus compras</p>
              </button>
              <button
                onClick={() => setActiveSection('facturas')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-left transition hover:border-violet-400/50"
              >
                <span className="text-lg">📄</span>
                <p className="mt-1 font-bold text-white">Mis Facturas</p>
                <p className="text-xs text-slate-400">Descarga tus facturas en PDF</p>
              </button>
              <button
                onClick={() => setActiveSection('pqr')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-left transition hover:border-rose-400/50"
              >
                <span className="text-lg">📋</span>
                <p className="mt-1 font-bold text-white">PQR</p>
                <p className="text-xs text-slate-400">Peticiones, quejas y reclamos</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductForm = () => (
    <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-6 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {editingProduct ? 'Editar producto' : 'Agregar producto'}
        </h2>
        {showProductForm && (
          <button
            onClick={resetProductForm}
            className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleProductSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Nombre
          <input
            name="name"
            value={productForm.name}
            onChange={handleProductChange}
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
            placeholder="Ej: iPhone 15"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Categoría
          <input
            name="category"
            value={productForm.category}
            onChange={handleProductChange}
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
            placeholder="Ej: Smartphone"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Precio
          <input
            type="number"
            step="0.01"
            name="price"
            value={productForm.price}
            onChange={handleProductChange}
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
            placeholder="0.00"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Etiqueta / Marca
          <input
            name="tag"
            value={productForm.tag}
            onChange={handleProductChange}
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
            placeholder="Ej: Apple"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-300 md:col-span-2">
          Imagen URL
          <input
            name="image"
            value={productForm.image}
            onChange={handleProductChange}
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
            placeholder="https://..."
          />
        </label>

        <div className="flex justify-end md:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            {editingProduct ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Productos</h2>
        <button
          onClick={() => setShowProductForm((prev) => !prev)}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2 font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition hover:scale-[1.02]"
        >
          {showProductForm ? 'Cerrar' : '+ Nuevo producto'}
        </button>
      </div>

      {showProductForm && renderProductForm()}

      <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/80 shadow-[0_0_30px_rgba(15,23,42,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/70 text-slate-300">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-slate-800 transition hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image || 'https://via.placeholder.com/80'}
                        alt={product.name}
                        className="h-11 w-11 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-semibold text-white">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.tag}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{product.category}</td>
                  <td className="px-4 py-3">
                    ${Number(product.price || 0).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(product.estado || 'Activo')}`}
                    >
                      {product.estado || 'Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="rounded-lg bg-slate-700 px-3 py-1.5 text-white transition hover:bg-slate-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-white transition hover:bg-red-500"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Usuarios</h2>
      <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/80 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/70 text-slate-300">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-800 transition hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3">
                    {esAdmin ? (
                      <select
                        value={String(item.rol || '').toLowerCase()}
                        onChange={(e) => handleRoleChange(item, e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
                      >
                        <option value="admin">Administrador</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="empleado">Empleado</option>
                        <option value="cliente">Cliente</option>
                      </select>
                    ) : (
                      <span className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-semibold capitalize text-slate-300">
                        {item.rol || item.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUserStatus(item)}
                        className="rounded-lg border border-cyan-500 px-3 py-1.5 text-cyan-300 transition hover:bg-cyan-500/10"
                      >
                        {item.status === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>
                      {esAdmin && (
                        <button
                          onClick={() => handleDeleteUser(item)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-white transition hover:bg-red-500"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    if (esCliente) {
      switch (activeSection) {
        case 'dashboard':
          return renderCustomerHome();
        case 'orders':
          return (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Mis Pedidos</h2>
              <OrdersList role="customer" />
            </div>
          );
        case 'cart':
          return (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Mi Carrito</h2>
              <CarritoResumen onIrAlCarrito={() => setShowCarrito(true)} />
            </div>
          );
        case 'facturas':
          return (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Mis Facturas</h2>
              <FacturasSection role="customer" />
            </div>
          );
        case 'pqr':
          return (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">PQR</h2>
              <PQRSection role="customer" />
            </div>
          );
        default:
          return null;
      }
    }

    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'products':
        return renderProducts();
      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Gestión de Pedidos</h2>
            <OrdersList role={role} />
          </div>
        );
      case 'ventas':
        return <VentasSection role={role} />;
      case 'facturas':
        return <FacturasSection role={role} />;
      case 'reportes':
        return <ReportesSection />;
      case 'pqr':
        return <PQRSection role={role} />;
      case 'vista-usuario':
        return <ClientViewSection />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#020b1a] text-slate-100">
      {notification && (
        <Notification notification={notification} onClose={() => setNotification(null)} />
      )}

      {pendingDeleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-[0_0_35px_rgba(239,68,68,0.18)]">
            <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-white">
              Confirmar eliminación
            </h3>
            <p className="mb-6 text-slate-300">
              ¿Deseas eliminar el producto{' '}
              <span className="font-semibold text-cyan-300">
                {pendingDeleteProduct.name || pendingDeleteProduct.id}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingDeleteProduct(null)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar: a la altura completa de la ventana, sin scroll. */}
      <aside className="flex h-full w-64 shrink-0 flex-col border-r border-cyan-500/10 bg-[#050b1a]">
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
          <NexusLogo size={32} gradientId={textos.gradientId} />
        </div>

        <nav className="min-h-0 flex-1 space-y-1 px-3 py-4">
          {(esCliente ? CUSTOMER_NAV_ITEMS : NAV_ITEMS).map(({ key, label, icon }) => {
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span>{icon}</span>
                {label}
              </button>
            );
          })}

          {esAdmin && (
            <Link
              to="/admin/empleados"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-violet-300 transition-colors hover:bg-violet-500/10"
            >
              <span>👤</span>
              Crear empleado
            </Link>
          )}

          <Link
            to="/"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/10"
            title="Abrir la página pública de NEXUS TECH"
          >
            <span>🌐</span>
            Ver página
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
            title="Cerrar la sesión actual"
          >
            <span>🚪</span>
            Cerrar sesión
          </button>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto">
        <AdminTopBar
          user={user}
          roleLabel={textos.topBar}
          onGoToUserView={esCliente ? null : () => setActiveSection('vista-usuario')}
        />

        <div className="mx-auto max-w-6xl px-8 py-8">{renderSection()}</div>
      </div>

      {esCliente && <Carrito show={showCarrito} onClose={() => setShowCarrito(false)} />}
    </div>
  );
};

/* Resumen del carrito para el panel del cliente: muestra cantidad y total,
   y un botón para abrir el modal completo del carrito. */
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
        setCarrito(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!carrito || !carrito.items || carrito.items.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 text-center">
        <p className="text-slate-400 text-sm">Tu carrito está vacío</p>
        <p className="mt-1 text-slate-500 text-xs">Agrega productos desde la tienda</p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }}
          className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          Ir a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Productos</span>
        <span className="font-semibold text-white">{carrito.cantidad_total}</span>
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <span className="text-slate-400">Total</span>
        <span className="font-bold text-cyan-300">
          ${Number(carrito.total || 0).toLocaleString('es-CO')}
        </span>
      </div>
      <button
        onClick={onIrAlCarrito}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2.5 font-bold text-slate-950 transition hover:scale-[1.02]"
      >
        Ir al carrito
      </button>
    </div>
  );
};

export default DashboardPanel;
