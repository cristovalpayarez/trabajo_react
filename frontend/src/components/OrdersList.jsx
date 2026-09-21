import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const EstadosPedido = {
  PENDIENTE: 'Pendiente',
  PROCESANDO: 'Procesando',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const ESTADO_COLORS = {
  Pendiente: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Procesando: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Enviado: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Entregado: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Cancelado: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const ESTADO_ICONS = {
  Pendiente: '⏳',
  Procesando: '🔄',
  Enviado: '🚚',
  Entregado: '✅',
  Cancelado: '❌',
};

import { API_BASE_URL } from '../config';

const OrdersList = ({ onOrderClick, role, ordersUrl = `${API_BASE_URL}/api/pedidos` }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [updatingId, setUpdatingId] = useState(null);
  const [notificacion, setNotificacion] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(ordersUrl, {
        headers: { Authorization: 'Bearer ' + token },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error cargando pedidos');

      let pedidos = Array.isArray(data.pedidos) ? data.pedidos : [];

      if (role === 'customer' && user) {
        pedidos = pedidos.filter((p) => p.usuario_id === user.id);
      }

      setOrders(
        pedidos.map((p) => ({
          id: p.id,
          usuario_id: p.usuario_id,
          cliente: p.cliente || `${p.usuario?.nombre || ''} ${p.usuario?.apellido || ''}`.trim(),
          correo: p.correo,
          total: p.total ? Number(p.total) : 0,
          estado: p.estado,
          fecha_pedido: p.fecha_pedido,
          productos: p.productos || p.detalles?.map((d) => `${d.producto_nombre} x${d.cantidad}`).join(', ') || 'Sin detalles',
          factura_enviada: p.factura_enviada || false,
        }))
      );
    } catch (err) {
      console.error('Error cargando pedidos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [ordersUrl, role]);

  const handleUpdateStatus = async (orderId, nuevoEstado) => {
    if (updatingId) return;
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${ordersUrl}/${orderId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'No se pudo actualizar');

      setOrders(orders.map((o) => (o.id === orderId ? { ...o, estado: nuevoEstado } : o)));
      showNotif('success', `Estado actualizado a "${nuevoEstado}"`);
    } catch (err) {
      showNotif('error', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const showNotif = (type, mensaje) => {
    setNotificacion({ type, mensaje });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const pedidosFiltrados = filter === 'Todos'
    ? orders
    : orders.filter((o) => o.estado === filter);

  const estadosDisponibles = ['Todos', ...new Set(orders.map((o) => o.estado))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <span className="ml-3 text-slate-400">Cargando pedidos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notificacion && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          notificacion.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {notificacion.mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-lg">No hay pedidos registrados</p>
          <p className="text-sm">Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {estadosDisponibles.map((estado) => (
              <button
                key={estado}
                onClick={() => setFilter(estado)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === estado
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/50 text-slate-400 border border-transparent hover:border-slate-600'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="space-y-3">
            {pedidosFiltrados.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 hover:border-cyan-500/30 transition cursor-pointer"
                onClick={() => onOrderClick?.(order)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-bold text-cyan-400">#{order.id}</span>
                      {order.fecha_pedido && (
                        <span className="text-xs text-slate-500">
                          {new Date(order.fecha_pedido).toLocaleDateString('es-CO')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{order.cliente || 'Cliente'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{order.correo}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{order.productos}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      ${order.total.toLocaleString('es-CO')}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${ESTADO_COLORS[order.estado] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                        {ESTADO_ICONS[order.estado] || '📄'} {order.estado}
                      </span>
                    </div>
                    {order.factura_enviada && (
                      <span className="mt-1 inline-flex items-center text-xs text-emerald-400">
                        📄 Factura enviada
                      </span>
                    )}
                  </div>
                </div>

                {/* Cambiar estado (staff) */}
                {role !== 'customer' && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
                    {['Pendiente', 'Procesando', 'Enviado', 'Entregado'].map((estado) => (
                      <button
                        key={estado}
                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, estado); }}
                        disabled={updatingId === order.id || order.estado === estado}
                        className={`px-2.5 py-1 text-xs rounded-md border transition ${
                          order.estado === estado
                            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                            : 'border-slate-700 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-40'
                        }`}
                      >
                        {ESTADO_ICONS[estado]} {estado}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersList;
