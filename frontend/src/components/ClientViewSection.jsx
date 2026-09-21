import React, { useState } from 'react';
import ProductGrid from './ProductGrid';
import VentasSection from './VentasSection';
import FacturasSection from './FacturasSection';
import PQRSection from './PQRSection';

const TABS = [
  { key: 'tienda', label: 'Tienda / Catálogo', icon: '🛍️' },
  { key: 'ventas', label: 'Ventas', icon: '💰' },
  { key: 'facturas', label: 'Facturas', icon: '📄' },
  { key: 'pqr', label: 'PQR', icon: '📋' },
];

/**
 * "Vista de usuario": muestra dentro del panel la parte del sitio que usa el
 * cliente final (catálogo, ventas, facturas y PQR), sin salir del panel.
 */
const ClientViewSection = () => {
  const [tab, setTab] = useState('tienda');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Sitio público</p>
        <h2 className="mt-2 text-3xl font-black text-white">Vista de usuario</h2>
        <p className="mt-1 text-slate-400">
          Así navega el cliente final la tienda y sus módulos de ventas, facturas y PQR.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === item.key
                ? 'border border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'tienda' && (
        <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/60">
          <ProductGrid />
        </div>
      )}

      {tab === 'ventas' && (
        <div className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <VentasSection role="customer" />
        </div>
      )}

      {tab === 'facturas' && (
        <div className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <FacturasSection role="customer" />
        </div>
      )}

      {tab === 'pqr' && (
        <div className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
          <PQRSection role="customer" />
        </div>
      )}
    </div>
  );
};

export default ClientViewSection;
