import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/carrito`;
const CHECKOUT_URL = `${API_BASE_URL}/api/checkout/`;

const CarritoContext = createContext(null);

const normalizeItem = (item = {}) => ({
  id: item.id || null,
  producto_id: item.producto_id || null,
  nombre: item.nombre || item.name || 'Sin nombre',
  marca: item.marca || item.brand || 'General',
  modelo: item.modelo || item.model || null,
  precio: Number(item.precio ?? item.price ?? 0),
  cantidad: item.cantidad || 0,
  subtotal: Number(item.subtotal ?? 0),
  stock_disponible: item.stock_disponible ?? item.stock ?? 0,
  imagen: item.imagen || item.image || null,
  estado: item.estado || 'Activo',
});

export const CarritoProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [cantidadTotal, setCantidadTotal] = useState(0);

  const cargarCarrito = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setItems([]);
        setTotal(0);
        setCantidadTotal(0);
        return null;
      }

      const respuesta = await fetch(API_URL, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.mensaje || 'No se pudo cargar el carrito');
      }

      const itemsNormalizados = Array.isArray(data.items)
        ? data.items.map(normalizeItem)
        : [];

      setItems(itemsNormalizados);
      setTotal(Number(data.total || 0));
      setCantidadTotal(data.cantidad_total || 0);

      return { items: itemsNormalizados, total: data.total, cantidad_total: data.cantidad_total };
    } catch (err) {
      console.error('Error cargando carrito:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCarrito();
  }, [cargarCarrito]);

  const agregarProducto = useCallback(async (producto_id, cantidad = 1) => {
    try {
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Debes iniciar sesión para agregar productos al carrito');
      }

      const respuesta = await fetch(`${API_URL}/items?producto_id=${producto_id}&cantidad=${cantidad}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.mensaje || 'No se pudo agregar al carrito');
      }

      await cargarCarrito();
      return data;
    } catch (err) {
      console.error('Error agregando al carrito:', err);
      setError(err.message);
      throw err;
    }
  }, [cargarCarrito]);

  const actualizarCantidad = useCallback(async (itemId, nuevaCantidad) => {
    try {
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Debes iniciar sesión');
      }

      const respuesta = await fetch(`${API_URL}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ cantidad: nuevaCantidad }),
      });

      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.mensaje || 'No se pudo actualizar la cantidad');
      }

      await cargarCarrito();
      return data;
    } catch (err) {
      console.error('Error actualizando cantidad:', err);
      setError(err.message);
      throw err;
    }
  }, [cargarCarrito]);

  const eliminarItem = useCallback(async (itemId) => {
    try {
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Debes iniciar sesión');
      }

      const respuesta = await fetch(`${API_URL}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.mensaje || 'No se pudo eliminar del carrito');
      }

      await cargarCarrito();
      return data;
    } catch (err) {
      console.error('Error eliminando item:', err);
      setError(err.message);
      throw err;
    }
  }, [cargarCarrito]);

  const vaciarCarrito = useCallback(async () => {
    try {
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Debes iniciar sesión');
      }

      const respuesta = await fetch(API_URL, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.mensaje || 'No se pudo vaciar el carrito');
      }

      await cargarCarrito();
      return data;
    } catch (err) {
      console.error('Error vaciando carrito:', err);
      setError(err.message);
      throw err;
    }
  }, [cargarCarrito]);

  const checkout = useCallback(async (direccion_envio = null) => {
    try {
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Debes iniciar sesión para realizar el pago');
      }

      const body = {};
      if (direccion_envio) {
        body.direccion_envio = direccion_envio;
      }

      const respuesta = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(body),
      });

      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.mensaje || 'No se pudo procesar el pago');
      }

      await cargarCarrito();

      return {
        pedidoId: data.pedidoId,
        ventaId: data.ventaId,
        numero_factura: data.numero_factura,
        total: data.total,
        total_con_iva: data.total_con_iva,
        estado: data.estado,
        factura_enviada: data.factura_enviada,
        cliente: data.cliente,
        mensaje: data.mensaje,
      };
    } catch (err) {
      console.error('Error en checkout:', err);
      setError(err.message);
      throw err;
    }
  }, [cargarCarrito]);

  return (
    <CarritoContext.Provider
      value={{
        items,
        loading,
        error,
        total,
        cantidadTotal,
        cargarCarrito,
        agregarProducto,
        actualizarCantidad,
        eliminarItem,
        vaciarCarrito,
        checkout,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  }
  return context;
};
