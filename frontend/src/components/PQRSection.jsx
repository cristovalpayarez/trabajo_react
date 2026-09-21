import React, { useEffect, useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

const PQRSection = ({ role }) => {
  const [pqrList, setPqrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPQR, setSelectedPQR] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [form, setForm] = useState({ tipo: 'Peticion', asunto: '', descripcion: '' });

  const fetchPQR = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filtroEstado) params.append('estado', filtroEstado);
    if (filtroTipo) params.append('tipo', filtroTipo);

    try {
      const res = await fetch(`${API_URL}/api/pqr?${params}`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setPqrList(data.pqr || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPQR();
  }, [filtroEstado, filtroTipo]);

  const handleCrearPQR = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/pqr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ tipo: 'Peticion', asunto: '', descripcion: '' });
        fetchPQR();
      }
    } catch {
    }
  };

  const handleResponder = async (pqrId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/pqr/${pqrId}/responder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ respuesta }),
      });
      if (res.ok) {
        setSelectedPQR(null);
        setRespuesta('');
        fetchPQR();
      }
    } catch {
    }
  };

  const handleCambiarEstado = async (pqrId, nuevoEstado) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/pqr/${pqrId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) fetchPQR();
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">PQR (Peticiones, Quejas, Reclamos)</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2 font-bold text-slate-950 transition hover:scale-[1.02]"
        >
          {showForm ? 'Cancelar' : '+ Nueva PQR'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCrearPQR} className="space-y-4 rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white">
            <option value="Peticion">Peticion</option>
            <option value="Queja">Queja</option>
            <option value="Reclamo">Reclamo</option>
          </select>
          <input value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} placeholder="Asunto" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" required />
          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion detallada..." rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white" required />
          <button type="submit" className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950">Enviar PQR</button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En proceso">En proceso</option>
          <option value="Respondida">Respondida</option>
          <option value="Cerrada">Cerrada</option>
        </select>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
          <option value="">Todos los tipos</option>
          <option value="Peticion">Peticion</option>
          <option value="Queja">Queja</option>
          <option value="Reclamo">Reclamo</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      ) : pqrList.length === 0 ? (
        <div className="py-10 text-center text-slate-500">No hay PQR registradas</div>
      ) : (
        <div className="space-y-3">
          {pqrList.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 hover:border-cyan-500/30 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.tipo === 'Peticion' ? 'bg-blue-500/20 text-blue-300' :
                      p.tipo === 'Queja' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {p.tipo}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      p.estado === 'Pendiente' ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-300' :
                      p.estado === 'En proceso' ? 'border-blue-500/30 bg-blue-500/20 text-blue-300' :
                      p.estado === 'Respondida' ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' :
                      'border-slate-500/30 bg-slate-500/20 text-slate-300'
                    }`}>
                      {p.estado}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-white">{p.asunto}</h3>
                  <p className="mt-1 text-sm text-slate-400">{p.descripcion}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {p.cliente} - {p.fecha_creacion ? new Date(p.fecha_creacion).toLocaleDateString('es-CO') : ''}
                  </p>
                  {p.respuesta && (
                    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                      <p className="text-xs font-bold text-emerald-400">Respuesta:</p>
                      <p className="mt-1 text-sm text-slate-300">{p.respuesta}</p>
                    </div>
                  )}
                </div>
                {role !== 'customer' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedPQR(selectedPQR?.id === p.id ? null : p)}
                      className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500"
                    >
                      Responder
                    </button>
                    {p.estado !== 'Cerrada' && (
                      <button
                        onClick={() => handleCambiarEstado(p.id, 'Cerrada')}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-red-500 hover:text-red-400"
                      >
                        Cerrar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {selectedPQR?.id === p.id && (
                <div className="mt-4 flex gap-2 border-t border-slate-800 pt-4">
                  <input
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={() => handleResponder(p.id)}
                    disabled={!respuesta.trim()}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-40"
                  >
                    Enviar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PQRSection;
