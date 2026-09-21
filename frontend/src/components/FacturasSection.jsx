import React, { useEffect, useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

const FacturasSection = ({ role }) => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const fetchFacturas = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filtroCliente) params.append('cliente', filtroCliente);
    if (filtroEstado) params.append('estado', filtroEstado);

    try {
      const res = await fetch(`${API_URL}/api/facturas?${params}`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setFacturas(data.facturas || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, [filtroCliente, filtroEstado]);

  const handleDescargarPDF = async (facturaId, numero) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/facturas/${facturaId}/pdf`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${numero}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Facturas</h2>

      <div className="flex flex-wrap gap-3">
        <input value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} placeholder="Buscar cliente..." className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
          <option value="">Todos los estados</option>
          <option value="Emitida">Emitida</option>
          <option value="Pagada">Pagada</option>
          <option value="Anulada">Anulada</option>
          <option value="Vencida">Vencida</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      ) : facturas.length === 0 ? (
        <div className="py-10 text-center text-slate-500">No hay facturas registradas</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Factura</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-cyan-400">{f.numero_factura}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {f.fecha_factura ? new Date(f.fecha_factura).toLocaleDateString('es-CO') : '-'}
                    </td>
                    <td className="px-4 py-3">{f.cliente_nombre || 'N/A'}</td>
                    <td className="px-4 py-3 font-bold text-white">${Number(f.total).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                        f.estado === 'Pagada' ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' :
                        f.estado === 'Emitida' ? 'border-blue-500/30 bg-blue-500/20 text-blue-300' :
                        f.estado === 'Anulada' ? 'border-red-500/30 bg-red-500/20 text-red-300' :
                        'border-yellow-500/30 bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDescargarPDF(f.id, f.numero_factura)}
                        className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturasSection;
