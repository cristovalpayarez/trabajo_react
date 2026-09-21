import React from 'react';
import { useCarrito } from '../context/CarritoContext';

const CarritoButton = ({ onClick }) => {
  const { cantidadTotal } = useCarrito();

  return (
    <button
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gaming-card border border-neon-purple text-gray-300 transition hover:border-neon-blue hover:text-neon-blue cursor-pointer"
      title="Ver carrito"
      aria-label="Abrir carrito"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>

      {cantidadTotal > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-neon-pink text-xs font-bold text-white shadow-lg">
          {cantidadTotal}
        </span>
      )}
    </button>
  );
};

export default CarritoButton;