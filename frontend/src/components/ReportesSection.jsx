import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

const ReportesSection = () => {
  const [fecha, setFecha] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');

  const handleDescargar = async (formato) => {
    setDescargando(true);
    setError('');
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (fecha) params.append('fecha', fecha);
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params.append('fecha_fin', fechaFin);

    try {
      const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
      const res = await fetch(`${API_URL}/api/reportes/ventas/${formato}?${params}`, {
        headers: { Authorization: 'Bearer ' + token },
      });

      if (!res.ok) {
        let mensaje = `No se pudo generar el reporte (HTTP ${res.status}).`;
        try {
          const data = await res.json();
          if (data?.mensaje) mensaje = data.mensaje;
        } catch {}
        setError(mensaje);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sufijo = fecha || (fechaInicio && fechaFin ? `${fechaInicio}_${fechaFin}` : 'hoy');
      a.download = `reporte_ventas_${sufijo}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Reportes de Ventas</h2>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Reporte por dia</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDescargar('pdf')}
              disabled={descargando || !fecha}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-40"
            >
              {descargando ? 'Descargando...' : 'PDF'}
            </button>
            <button
              onClick={() => handleDescargar('excel')}
              disabled={descargando || !fecha}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-40"
            >
              {descargando ? 'Descargando...' : 'Excel'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Reporte por rango de fechas</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Fecha inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Fecha fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDescargar('pdf')}
              disabled={descargando || !fechaInicio || !fechaFin}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-40"
            >
              {descargando ? 'Descargando...' : 'PDF'}
            </button>
            <button
              onClick={() => handleDescargar('excel')}
              disabled={descargando || !fechaInicio || !fechaFin}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-40"
            >
              {descargando ? 'Descargando...' : 'Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesSection;
