import React, { createContext, useContext, useEffect, useState } from 'react';

import { API_BASE_URL } from '../config';

const ProductContext = createContext();
const API_URL = `${API_BASE_URL}/api/productos`;

const normalizeProduct = (product = {}) => ({
  id: product.id,
  name: product.nombre || product.name || 'Sin nombre',
  category: product.categoria || product.category || 'General',
  price: Number(product.precio ?? product.price ?? 0),
  image: product.imagen || product.image || '',
  tag: product.marca || product.tag || product.modelo || 'General',
  description: product.descripcion || product.description || '',
  stock: Number(product.stock ?? 0),
  estado: product.estado || product.state || 'Activo',
  categoria_id: product.categoria_id ?? null,
  nombre: product.nombre || product.name || 'Sin nombre',
  marca: product.marca || product.tag || product.modelo || 'General',
  modelo: product.modelo || null,
  descripcion: product.descripcion || product.description || null,
  precio: Number(product.precio ?? product.price ?? 0),
  imagen: product.imagen || product.image || null,
  categoria: product.categoria || product.category || 'General',
});

const buildProductPayload = (product = {}) => ({
  categoria_id: product.categoria_id ?? null,
  categoria: product.category ?? product.categoria ?? null,
  nombre: product.nombre ?? product.name ?? '',
  marca: product.marca ?? product.tag ?? product.brand ?? 'General',
  modelo: product.modelo ?? product.model ?? null,
  descripcion: product.descripcion ?? product.description ?? null,
  precio: Number(product.precio ?? product.price ?? 0),
  stock: Number(product.stock ?? 0),
  imagen: product.imagen ?? product.image ?? null,
  estado: product.estado ?? product.state ?? 'Activo',
});

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('No se pudieron obtener los productos');
      }

      const data = await response.json();
      const productList = Array.isArray(data) ? data : data.productos || [];
      setProducts(productList.map(normalizeProduct));
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  const addProduct = async (product) => {
    try {
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(buildProductPayload(product)),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'No se pudo crear el producto');
      }

      if (data.producto) {
        setProducts((prevProducts) => [...prevProducts, normalizeProduct(data.producto)]);
      } else {
        await getProducts();
      }

      return data;
    } catch (error) {
      console.error('Error creando producto:', error);
      setError(error.message);
      throw error;
    }
  };

  const updateProduct = async (id, updatedProduct) => {
    try {
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(buildProductPayload(updatedProduct)),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'No se pudo actualizar el producto');
      }

      if (data.producto) {
        setProducts((prevProducts) =>
          prevProducts.map((product) => (product.id === id ? normalizeProduct(data.producto) : product))
        );
      } else {
        await getProducts();
      }

      return data;
    } catch (error) {
      console.error('Error actualizando producto:', error);
      setError(error.message);
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'No se pudo eliminar el producto');
      }

      setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id));
      return data;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      setError(error.message);
      throw error;
    }
  };

  const refreshProducts = async () => {
    await getProducts();
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts debe usarse dentro de ProductProvider');
  }
  return context;
};

