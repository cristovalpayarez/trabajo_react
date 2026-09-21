import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCarrito } from '../context/CarritoContext';
import Button from './Button';
import ProductModal from './ProductModal';
import Carrito from './Carrito';



const ProductGrid = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { agregarProducto, cantidadTotal } = useCarrito();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [aviso, setAviso] = useState(null);

  const catalogProducts = Array.isArray(products) ? products : [];

  const formatPrice = (value) => {
    const rawValue = Number(value ?? 0);
    return `$${Number.isFinite(rawValue) ? rawValue.toLocaleString() : '0'} USD`;
  };

  const mostrarAviso = (tipo, texto) => {
    setAviso({ tipo, texto });
    window.setTimeout(() => setAviso(null), 4000);
  };

  const agregarAlCarrito = async (product) => {
    try {
      await agregarProducto(product.id, 1);
      mostrarAviso('success', `"${product.name}" agregado al carrito`);
      setIsCartOpen(true);
    } catch (err) {
      const msg = err?.message || 'No se pudo agregar al carrito';
      mostrarAviso('error', msg);
      if (/iniciar sesión/i.test(msg)) {
        window.setTimeout(() => navigate('/login'), 1500);
      }
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    agregarAlCarrito(product);
  };

  const handleAddFromModal = (product) => {
    setIsModalOpen(false);
    agregarAlCarrito(product);
  };

  return (
    <section className="w-full px-6 sm:px-12 py-10">

      {aviso && (
        <div
          className={`fixed top-28 right-6 z-[200] w-[min(calc(100vw-3rem),380px)] rounded-2xl border p-4 shadow-[0_0_30px_rgba(43,242,251,0.25)] backdrop-blur-md ${
            aviso.tipo === 'error'
              ? 'border-neon-pink/70 bg-gaming-card/95'
              : 'border-neon-blue/70 bg-gaming-card/95'
          }`}
        >
          <p className={`font-black ${aviso.tipo === 'error' ? 'text-neon-pink' : 'text-neon-blue'}`}>
            {aviso.tipo === 'error' ? '⚠ No se pudo completar' : '✓ Operación exitosa'}
          </p>
          <p className="mt-1 text-sm text-gray-200">{aviso.texto}</p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 border-b border-neon-purple/30 pb-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white text-left">
            Catálogo <span className="text-neon-purple">Destacado</span>
          </h2>

          <p className="text-gray-300 text-base sm:text-lg text-left mt-1">
            Equipos seleccionados para máximo rendimiento
          </p>
        </div>

        {/* BOTÓN DEL CARRITO */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-gaming-card border border-neon-purple px-5 py-3 rounded-xl text-white hover:bg-neon-purple/20 transition cursor-pointer"
        >
          Carrito

          {cantidadTotal > 0 && (
            <span className="absolute -top-2 -right-2 bg-neon-purple text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cantidadTotal}
            </span>
          )}
        </button>
      </div>

      {/* PRODUCTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">

        {catalogProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => {
              setSelectedProduct(product);
              setIsModalOpen(true);
            }}
            className="bg-gaming-card border border-gray-800 rounded-2xl overflow-hidden hover:border-neon-blue transition-all duration-300 hover:shadow-[0_0_20px_rgba(43,242,251,0.3)] flex flex-col justify-between group cursor-pointer"
          >

            <div>
              <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-gaming-dark flex items-center justify-center p-3">

                <img
                  src={product.image || 'https://via.placeholder.com/400x300?text=Producto'}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />

                <span className="absolute top-3 right-3 bg-neon-purple/90 text-white text-sm font-bold px-3.5 py-1.5 rounded-full">
                  {product.tag || product.marca || 'General'}
                </span>
              </div>

              <div className="p-5 text-left">

                <span className="text-sm uppercase font-bold text-neon-blue tracking-wider block mb-1">
                  {product.category || product.categoria || 'General'}
                </span>

                <h3 className="text-2xl font-black text-white">
                  {product.name}
                </h3>

                <p className="text-3xl font-extrabold text-white mt-3">
                  {formatPrice(product.price ?? product.precio ?? 0)}
                </p>

              </div>
            </div>

            <div className="p-5 pt-0">
              <Button
                variant="primary"
                onClick={(e) => handleAddToCart(e, product)}
              >
                Agregar al carrito
              </Button>
            </div>

          </div>
        ))}

      </div>

      {/* MODAL DEL PRODUCTO */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddFromModal}
      />

      {/* CARRITO REAL (backend) */}
      <Carrito show={isCartOpen} onClose={() => setIsCartOpen(false)} />

    </section>
  );
};

export default ProductGrid;