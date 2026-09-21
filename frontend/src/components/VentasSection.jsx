import React, { useEffect, useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

const FORM_VACIO = {
  cliente_nombre: '',
  cliente_documento: '',
  cliente_correo: '',
  item_nombre: '',
  cantidad: 1,
  precio_unitario: '',
  tipo: 'producto',
};

const VentasSection = ({ role }) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);

  const esStaff = role !== 'customer';

  const mostrarAviso = (tipo, texto) => {
    setAviso({ tipo, texto });
    window.setTimeout(() => setAviso(null), 5000);
  };

  const fetchVentas = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filtroFecha) {
      params.append('fecha_inicio', filtroFecha);
      params.append('fecha_fin', filtroFecha);
    }
    if (filtroCliente) params.append('cliente', filtroCliente);
    if (filtroEstado) params.append('estado', filtroEstado);

    try {
      const res = await fetch(`${API_URL}/api/ventas?${params}`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setVentas(data.ventas || []);
    } catch {
      mostrarAviso('error', 'No se pudo cargar el historial de ventas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, [filtroFecha, filtroCliente, filtroEstado]);

  const handleCrearVenta = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          cliente_nombre: form.cliente_nombre,
          cliente_documento: form.cliente_documento,
          cliente_correo: form.cliente_correo,
          items: [
            {
              tipo: form.tipo,
              item_nombre: form.item_nombre,
              cantidad: Number(form.cantidad),
              precio_unitario: Number(form.precio_unitario),
              descuento: 0,
            },
          ],
          descuento: 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarAviso('error', data.mensaje || 'No se pudo registrar la venta.');
        return;
      }

      mostrarAviso(
        'success',
        `Venta #${data.ventaId} registrada. Factura ${data.numero_factura} generada por $${Number(
          data.total || 0
        ).toLocaleString('es-CO')}.`
      );

      setShowForm(false);
      setForm(FORM_VACIO);
      fetchVentas();
    } catch {
      mostrarAviso('error', 'No se pudo conectar con el servidor.');
    }
  };

  const handleGenerarDemo = async () => {
    setGenerando(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/ventas/demo?cantidad=15`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarAviso('error', data.mensaje || 'No se pudieron generar las ventas de ejemplo.');
        return;
      }

      mostrarAviso(
        'success',
        `${data.ventas_creadas} ventas y ${data.facturas_creadas} facturas de ejemplo creadas. Ve a "Inicio" para ver los gráficos actualizados.`
      );
      fetchVentas();
    } catch {
      mostrarAviso('error', 'No se pudo conectar con el servidor.');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">Historial de Ventas</h2>
        {esStaff && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerarDemo}
              disabled={generando}
              className="rounded-xl border border-violet-500/50 bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-300 transition hover:bg-violet-500/20 disabled:opacity-40"
              title="Crea ventas repartidas en los últimos 60 días para alimentar los gráficos y reportes"
            >
              {generando ? 'Generando...' : '📊 Generar ventas de ejemplo'}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2 font-bold text-slate-950 shadow-lg transition hover:scale-[1.02]"
            >
              {showForm ? 'Cancelar' : '+ Nueva Venta'}
            </button>
          </div>
        )}
      </div>

      {aviso && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            aviso.tipo === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {aviso.texto}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCrearVenta}
          className="grid gap-4 rounded-2xl border border-cyan-500/20 bg-slate-900 p-6 md:grid-cols-2"
        >
          <input
            value={form.cliente_nombre}
            onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
            placeholder="Nombre del cliente"
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
          />
          <input
            value={form.cliente_documento}
            onChange={(e) => setForm({ ...form, cliente_documento: e.target.value })}
            placeholder="Documento"
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
          />
          <input
            value={form.cliente_correo}
            onChange={(e) => setForm({ ...form, cliente_correo: e.target.value })}
            placeholder="Correo"
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
          >
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
          </select>
          <input
            value={form.item_nombre}
            onChange={(e) => setForm({ ...form, item_nombre: e.target.value })}
            placeholder="Nombre del producto/servicio"
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white md:col-span-2"
            required
          />
          <input
            type="number"
            min="1"
            value={form.cantidad}
            onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
            placeholder="Cantidad"
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.precio_unitario}
            onChange={(e) => setForm({ ...form, precio_unitario: e.target.value })}
            placeholder="Precio unitario"
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-white"
            required
          />
          <p className="text-xs text-slate-500 md:col-span-2">
            Al registrar la venta se genera automáticamente su factura y se actualizan los
            indicadores y gráficos del panel.
          </p>
          <button
            type="submit"
            className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 md:col-span-2"
          >
            Registrar Venta
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
        <input
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
          placeholder="Buscar cliente..."
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="">Todos los estados</option>
          <option value="Completada">Completada</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Cancelada">Cancelada</option>
          <option value="Reembolsada">Reembolsada</option>
        </select>
        {(filtroFecha || filtroCliente || filtroEstado) && (
          <button
            onClick={() => {
              setFiltroFecha('');
              setFiltroCliente('');
              setFiltroEstado('');
            }}
            className="rounded-xl border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      ) : ventas.length === 0 ? (
        <div className="py-10 text-center text-slate-500">
          No hay ventas registradas
          {esStaff && (
            <p className="mt-2 text-xs text-slate-600">
              Usa «Generar ventas de ejemplo» o «+ Nueva Venta» para alimentar los gráficos.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-slate-300">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-cyan-400">#{v.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {v.fecha_venta
                        ? new Date(v.fecha_venta).toLocaleDateString('es-CO')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">{v.cliente_nombre || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{v.vendedor || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {v.detalles?.map((d) => `${d.item_nombre} x${d.cantidad}`).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      ${Number(v.total).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                          v.estado === 'Completada'
                            ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                            : v.estado === 'Pendiente'
                              ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-300'
                              : 'border-red-500/30 bg-red-500/20 text-red-300'
                        }`}
                      >
                        {v.estado}
                      </span>
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

export default VentasSection;
