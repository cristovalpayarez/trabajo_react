import React, { useState } from 'react';
import { useCarrito } from '../context/CarritoContext';
import Notification from './Notification';

const Carrito = ({ show = true, onClose }) => {
  const {
    items,
    total,
    cantidadTotal,
    loading,
    error,
    actualizarCantidad,
    eliminarItem,
    vaciarCarrito,
    checkout,
  } = useCarrito();

  const [notificacion, setNotificacion] = useState(null);
  const [enProceso, setEnProceso] = useState(false);
  const [direccionEnvio, setDireccionEnvio] = useState('');

  const showNotif = (type, message) => {
    setNotificacion({ type, message });
    setTimeout(() => setNotificacion(null), 6000);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      showNotif('error', 'Tu carrito está vacío');
      return;
    }

    setEnProceso(true);
    try {
      const resultado = await checkout(direccionEnvio || null);
      const totalFinal = Number(resultado.total_con_iva ?? resultado.total ?? 0);
      let detalle = `¡Pedido #${resultado.pedidoId} creado! Total: $${totalFinal.toLocaleString('es-CO')}.`;
      if (resultado.numero_factura) {
        detalle += ` Factura ${resultado.numero_factura} generada (disponible en «Mis Facturas»).`;
      }
      if (resultado.factura_enviada) {
        detalle += ' La factura en PDF fue enviada a tu correo.';
      } else if (resultado.factura_aviso) {
        detalle += ' ' + resultado.factura_aviso;
      }
      showNotif('success', detalle);
      if (onClose) onClose();
      setDireccionEnvio('');
    } catch (err) {
      showNotif('error', err.message || 'Error en el pago. Intenta de nuevo.');
    } finally {
      setEnProceso(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {notificacion && (
        <Notification notification={notificacion} onClose={() => setNotificacion(null)} />
      )}

      <div className="fixed inset-0 z-50 flex items-start justify-end pt-14 sm:pt-20">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-md bg-[#0f172a] border-l border-cyan-500/20 shadow-2xl flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <h2 className="text-xl font-bold text-white">🛒 Carrito</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {cantidadTotal} {cantidadTotal === 1 ? 'producto' : 'productos'} · $
                {total.toLocaleString('es-CO')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {loading && (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
              <span className="ml-3">Cargando...</span>
            </div>
          )}

          {error && !loading && (
            <div className="mx-5 mt-3 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-10">
              <div className="text-5xl mb-4 opacity-60">🛒</div>
              <p className="text-slate-400 text-sm">Tu carrito está vacío</p>
              <p className="text-xs text-slate-600 mt-1">Agrega productos para comenzar</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <>
              <div className="overflow-y-auto flex-1">
                <ul className="divide-y divide-slate-800/60">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-3 px-5 py-4 first:pt-2 last:pb-2"
                    >
                      <div className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">
                            {item.nombre}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {item.marca}
                            {item.modelo ? ` · ${item.modelo}` : ''}
                          </p>
                          <p className="text-xs text-cyan-400 font-medium mt-1">
                            ${item.precio.toLocaleString('es-CO')} c/u
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                actualizarCantidad(item.id, Math.max(1, item.cantidad - 1))
                              }
                              disabled={item.cantidad <= 1 || loading}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              -
                            </button>

                            <span className="w-8 text-center text-sm font-semibold text-white">
                              {item.cantidad}
                            </span>

                            <button
                              onClick={() =>
                                actualizarCantidad(item.id, item.cantidad + 1)
                              }
                              disabled={item.cantidad >= item.stock_disponible || loading}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-cyan-400">
                              ${item.subtotal.toLocaleString('es-CO')}
                            </span>
                            <button
                              onClick={() => eliminarItem(item.id)}
                              disabled={loading}
                              className="text-xs text-slate-500 hover:text-red-400 transition disabled:opacity-40"
                              title="Eliminar del carrito"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">
                    ${total.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>IVA (19%)</span>
                  <span className="text-white">
                    ${(total * 0.19).toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-lg font-bold text-white border-t border-slate-800 pt-3">
                  <span>Total</span>
                  <span className="text-cyan-400">
                    ${(total * 1.19).toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="pt-2">
                  <label className="mb-2 block text-xs text-slate-400">
                    Dirección de envío (opcional)
                  </label>
                  <input
                    type="text"
                    value={direccionEnvio}
                    onChange={(e) => setDireccionEnvio(e.target.value)}
                    placeholder="Calle 123, Ciudad"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={enProceso}
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-sky-600 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {enProceso ? 'Procesando...' : '✅ Finalizar compra · La factura en PDF llega a tu correo'}
                </button>

                <button
                  onClick={vaciarCarrito}
                  disabled={enProceso || items.length === 0}
                  className="w-full py-2 text-xs text-slate-500 transition hover:text-red-400 disabled:opacity-40"
                >
                  Vaciar carrito
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Carrito;
