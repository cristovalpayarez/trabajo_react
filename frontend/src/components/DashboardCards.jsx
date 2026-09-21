import React, { useEffect, useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

const CARD_SECTION_MAP = {
  Usuarios: 'users',
  Productos: 'products',
  Servicios: 'products',
  'Ventas Totales': 'ventas',
  Facturas: 'facturas',
  PQR: 'pqr',
  'Ventas Hoy': 'ventas',
  'Facturacion Hoy': 'facturas',
};

const DashboardCards = ({ role = 'admin', onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/api/dashboard/stats`, {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-700 bg-slate-800/50" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: 'Usuarios',
      value: stats.total_usuarios,
      icon: '👥',
      color: 'from-cyan-500/20 to-cyan-900/20',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
    },
    {
      label: 'Productos',
      value: stats.total_productos,
      icon: '📦',
      color: 'from-violet-500/20 to-violet-900/20',
      border: 'border-violet-500/20',
      text: 'text-violet-400',
    },
    {
      label: 'Servicios',
      value: stats.total_servicios,
      icon: '🔧',
      color: 'from-emerald-500/20 to-emerald-900/20',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
    },
    {
      label: 'Ventas Totales',
      value: stats.total_ventas,
      icon: '💰',
      color: 'from-amber-500/20 to-amber-900/20',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
    },
    {
      label: 'Facturas',
      value: stats.total_facturas,
      icon: '📄',
      color: 'from-pink-500/20 to-pink-900/20',
      border: 'border-pink-500/20',
      text: 'text-pink-400',
    },
    {
      label: 'PQR',
      value: stats.total_pqr,
      icon: '📋',
      color: 'from-red-500/20 to-red-900/20',
      border: 'border-red-500/20',
      text: 'text-red-400',
    },
    {
      label: 'Ventas Hoy',
      value: stats.ventas_hoy,
      icon: '📈',
      color: 'from-teal-500/20 to-teal-900/20',
      border: 'border-teal-500/20',
      text: 'text-teal-400',
    },
    {
      label: 'Facturacion Hoy',
      value: `$${Number(stats.facturacion_hoy || 0).toLocaleString('es-CO')}`,
      icon: '💳',
      color: 'from-indigo-500/20 to-indigo-900/20',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
    },
  ];

  if (role === 'customer') {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => {
        const sectionKey = CARD_SECTION_MAP[card.label];
        const Wrapper = onNavigate && sectionKey ? 'button' : 'div';
        const wrapperProps =
          onNavigate && sectionKey
            ? { onClick: () => onNavigate(sectionKey), type: 'button' }
            : {};
        return (
          <Wrapper
            key={card.label}
            {...wrapperProps}
            className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl ${onNavigate && sectionKey ? 'cursor-pointer text-left' : ''}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className={`mt-2 text-3xl font-black ${card.text}`}>{card.value}</p>
          </Wrapper>
        );
      })}
    </div>
  );
};

export default DashboardCards;
