import React from 'react';

/**
 * Barra superior de los paneles (Administrador y Empleado).
 * Muestra los datos del usuario logueado y el acceso rápido a la
 * "Vista de usuario". Los botones "Ver página" y "Cerrar sesión"
 * viven ahora en el sidebar (DashboardPanel.jsx).
 */
const AdminTopBar = ({ user, roleLabel, onGoToUserView }) => {
  const inicial = (user?.nombre || user?.correo || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/10 bg-[#050b1a] px-6 py-4 sm:px-8">
      <div className="flex items-center gap-2">
        {onGoToUserView && (
          <button
            type="button"
            onClick={onGoToUserView}
            className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20"
            title="Ver la tienda y los módulos como los ve el usuario final"
          >
            <span>🧑‍💻</span>
            Vista de usuario
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-600 text-base font-black text-slate-950">
            {inicial}
          </span>
          <div className="text-left leading-tight">
            <p className="text-sm font-bold text-white">
              {user?.nombre} {user?.apellido}
            </p>
            <p className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-cyan-300">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;
