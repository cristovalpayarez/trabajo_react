import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const API_URL = 'http://127.0.0.1:8000';

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#fb923c'];

const VentasChart = () => {
  const [ventasDiarias, setVentasDiarias] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [dias, setDias] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/dashboard/ventas-por-dia?dias=${dias}`, {
        headers: { Authorization: 'Bearer ' + token },
      }).then((r) => r.json()),
      fetch(`${API_URL}/api/dashboard/ventas-por-mes?meses=12`, {
        headers: { Authorization: 'Bearer ' + token },
      }).then((r) => r.json()),
    ])
      .then(([diaria, mensual]) => {
        setVentasDiarias(
          (diaria.ventas_por_dia || []).map((v) => ({
            ...v,
            fecha: v.fecha.substring(5),
            ingresos: Number(v.total_ingresos),
          }))
        );
        setVentasMensuales(
          (mensual.ventas_por_mes || []).map((v) => ({
            ...v,
            ingresos: Number(v.total_ingresos),
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dias]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-700 bg-slate-800/50" />
        ))}
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 shadow-xl">
          <p className="text-sm font-semibold text-white">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-xs text-slate-300">
              {p.name}: {p.name === 'ingresos' ? `$${Number(p.value).toLocaleString('es-CO')}` : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const pieData = ventasMensuales.map((v) => ({
    name: v.mes,
    value: v.ingresos,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-bold text-white">Periodo:</h3>
        {[7, 15, 30, 60].map((d) => (
          <button
            key={d}
            onClick={() => setDias(d)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              dias === d
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/50 text-slate-400 border border-transparent hover:border-slate-600'
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <h3 className="mb-4 text-base font-bold text-white">Ventas por dia (barras)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ventasDiarias}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="fecha" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="total_ventas" name="Ventas" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <h3 className="mb-4 text-base font-bold text-white">Tendencia mensual (lineal)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ventasMensuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Line
                type="monotone"
                dataKey="total_ventas"
                name="Ventas"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ r: 4, fill: '#22d3ee' }}
              />
              <Line
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ r: 4, fill: '#a78bfa' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <h3 className="mb-4 text-base font-bold text-white">Ingresos acumulados (area)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={ventasMensuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Area
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="#34d399"
                fill="#34d399"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="total_ventas"
                name="Ventas"
                stroke="#22d3ee"
                fill="#22d3ee"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <h3 className="mb-4 text-base font-bold text-white">Distribucion mensual de ingresos</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#94a3b8' }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString('es-CO')}`}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VentasChart;
