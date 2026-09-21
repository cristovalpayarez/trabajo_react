import React from 'react';

const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 border border-neon-purple w-full max-w-xl p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(181,53,246,0.3)] relative">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold cursor-pointer"
        >
          &times;
        </button>
        
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-48 h-48 object-contain bg-gray-800 rounded-2xl p-2 border border-gray-700" 
          />
          <div className="flex-1">
            <span className="text-xs font-bold px-2.5 py-1 bg-neon-purple/20 text-neon-purple rounded-full">
              {product.category || 'EQUIPAMIENTO GAMER'}
            </span>
            <h2 className="text-2xl font-black text-white mt-2">{product.name}</h2>
            <p className="text-3xl font-black text-neon-blue mt-2">{product.price}</p>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              {product.description || 'Dispositivo de última generación diseñado para ofrecer el máximo rendimiento, gráficos excepcionales y velocidad insuperable en cualquier tarea o juego.'}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-8 flex gap-4">
          <button 
            onClick={() => {
              if (onAddToCart) onAddToCart(product);
              onClose();
            }}
            className="w-full py-4 bg-neon-blue text-black font-black text-lg rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(43,242,251,0.4)] cursor-pointer"
          >
            AGREGAR AL CARRITO
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductModal;
