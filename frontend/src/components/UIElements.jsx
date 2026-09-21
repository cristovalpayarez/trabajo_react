// src/components/UIElements.jsx
export const InputField = ({ label, name, type = "text", value, onChange, error, placeholder }) => (
  <div className="w-full">
    <label className="block text-sm font-bold text-gray-300 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3 bg-gray-800 border-2 rounded-xl text-white placeholder-gray-500 outline-none transition-all ${
        error ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-neon-blue"
      }`}
    />
    {error && <p className="text-red-400 text-xs mt-1 font-bold">{error}</p>}
  </div>
);

export const SelectField = ({ label, name, value, onChange, options, error }) => (
  <div className="w-full">
    <label className="block text-sm font-bold text-gray-300 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full p-3 bg-gray-800 border-2 rounded-xl text-white outline-none transition-all cursor-pointer ${
        error ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-neon-blue"
      }`}
    >
      <option value="" className="bg-gray-900 text-gray-400">Seleccione...</option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-gray-900 text-white">
          {opt}
        </option>
      ))}
    </select>
    {error && <p className="text-red-400 text-xs mt-1 font-bold">{error}</p>}
  </div>
);
