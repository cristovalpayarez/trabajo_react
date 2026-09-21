import React from 'react';

const Select = ({ label, name, value, onChange, options = [], error, ...props }) => {
  return (
    <div className="mb-4 text-left">
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold mb-2 text-gray-300">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 bg-gaming-card text-white rounded-lg border transition-all duration-300 focus:outline-none ${
          error
            ? 'border-neon-pink focus:shadow-[0_0_10px_rgba(255,42,109,0.8)]'
            : 'border-gray-700 focus:border-neon-blue focus:shadow-[0_0_12px_rgba(43,242,251,0.6)]'
        }`}
        {...props}
      >
        <option value="" disabled className="bg-gaming-dark text-gray-400">
          Seleccione una opción...
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gaming-dark text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-neon-pink font-medium">{error}</p>}
    </div>
  );
};

export default Select;
