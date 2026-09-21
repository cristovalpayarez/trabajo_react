import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialForm = { nombre: '', apellido: '', tipo_documento: 'CC', numero_documento: '', direccion: '', telefono: '', correo: '', password: '' };

const EmployeeForm = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'No hay sesión activa para crear empleados.' });
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/empleado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: data.mensaje || 'No se pudo crear el empleado.' });
        return;
      }

      setForm(initialForm);
      setMessage({ type: 'success', text: 'Empleado creado y guardado en la base de datos.' });
    } catch (error) {
      console.error('Error creando empleado:', error);
      setMessage({ type: 'error', text: 'No se pudo conectar con el servidor.' });
    }
  };

  const fields = [['nombre', 'Nombre', 50], ['apellido', 'Apellido', 50], ['numero_documento', 'Número de documento', 30], ['direccion', 'Dirección', 150], ['telefono', 'Teléfono', 20], ['correo', 'Correo electrónico', 100]];
  return (
    <div className="min-h-screen bg-gaming-dark text-white px-6 sm:px-12 py-10">
      <div className="max-w-3xl mx-auto bg-gaming-card border border-neon-purple/40 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-8"><div><p className="text-neon-blue font-bold uppercase tracking-widest text-sm">Administración</p><h1 className="text-3xl font-black mt-2">Registrar empleado</h1></div><Link to="/admin" className="text-neon-blue font-bold">Volver</Link></div>
        {message.text && <p className={`mb-5 p-3 rounded-lg ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{message.text}</p>}
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
          {fields.map(([name, label, maxLength]) => <label key={name} className="flex flex-col gap-2"><span className="font-bold">{label}</span><input required name={name} value={form[name]} maxLength={maxLength} onChange={handleChange} type={name === 'correo' ? 'email' : 'text'} className="rounded-lg bg-gaming-dark border border-gray-700 px-4 py-3" /></label>)}
          <label className="flex flex-col gap-2"><span className="font-bold">Tipo de documento</span><select name="tipo_documento" value={form.tipo_documento} onChange={handleChange} className="rounded-lg bg-gaming-dark border border-gray-700 px-4 py-3"><option value="CC">Cédula</option><option value="CE">Cédula de extranjería</option><option value="PAS">Pasaporte</option></select></label>
          <label className="flex flex-col gap-2"><span className="font-bold">Contraseña</span><input required name="password" value={form.password} minLength={6} maxLength={64} onChange={handleChange} type="password" className="rounded-lg bg-gaming-dark border border-gray-700 px-4 py-3" /></label>
          <button type="submit" className="sm:col-span-2 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue font-bold">Crear empleado</button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;

