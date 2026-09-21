import React from 'react';

const Input = ({ label, type = 'text', name, value, onChange, placeholder, error, ...props }) => {
  return (
    <div className="mb-4 text-left">
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold mb-2 text-gray-300">
          {label}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-gaming-card text-white rounded-lg border transition-all duration-300 focus:outline-none ${
          error
            ? 'border-neon-pink focus:shadow-[0_0_10px_rgba(255,42,109,0.8)]'
            : 'border-gray-700 focus:border-neon-purple focus:shadow-[0_0_12px_rgba(181,53,246,0.6)]'
        }`}
        {...props}
      />
      {/* Mensaje de error para validación en tiempo real */}
      {error && <p className="mt-1 text-xs text-neon-pink font-medium">{error}</p>}
    </div>
  );
};

export default Input;
