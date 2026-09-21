import React from 'react';

const Button = ({ children, type = 'button', onClick, variant = 'primary', className = '', ...props }) => {
  // Estilos RGB base y variantes (Primary = Gradient Neón, Secondary = Borde Neón, Danger = Rojo Gamer)
  const variants = {
    primary: 'bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white hover:opacity-90 shadow-[0_0_15px_rgba(181,53,246,0.5)] hover:shadow-[0_0_25px_rgba(43,242,251,0.8)]',
    secondary: 'border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-gaming-dark hover:shadow-[0_0_20px_rgba(43,242,251,0.6)]',
    danger: 'bg-neon-pink text-white hover:bg-red-600 shadow-[0_0_15px_rgba(255,42,109,0.5)]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
