import React, { useState } from 'react';
import Notification from './Notification';

const RegisterModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipoDoc: 'CC',
    numDoc: '',
    direccion: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);

  if (!isOpen) return null;

  // Campos que solo deben aceptar dígitos
  const NUMERIC_FIELDS = ['numDoc', 'telefono'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (NUMERIC_FIELDS.includes(name)) {
      // Bloquea cualquier caracter que no sea dígito
      nextValue = value.replace(/\D/g, '');
    }

    const nextFormData = { ...formData, [name]: nextValue };
    setFormData(nextFormData);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateField(name, nextValue, nextFormData)
    }));

    if (name === 'password') {
      setErrors((currentErrors) => ({
        ...currentErrors,
        confirmPassword: validateField(
          'confirmPassword',
          nextFormData.confirmPassword,
          nextFormData
        )
      }));
    }
  };

  // Evita que se escriban letras/símbolos en los campos numéricos
  const handleNumericKeyDown = (e) => {
    const teclasPermitidas = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
      'Tab', 'Home', 'End'
    ];
    if (teclasPermitidas.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumericPaste = (e) => {
    const texto = e.clipboardData.getData('text');
    if (/\D/.test(texto)) {
      e.preventDefault();
      const soloNumeros = texto.replace(/\D/g, '');
      const { name } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: (prev[name] + soloNumeros)
      }));
    }
  };

  const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  const validateField = (name, value, values = formData) => {
    if (!value.trim()) return 'Este campo es obligatorio';

    if (NUMERIC_FIELDS.includes(name) && !/^\d+$/.test(value)) {
      return 'Este campo solo admite números';
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Correo electrónico no válido';
    }

    if (name === 'password') {
      if (!PASSWORD_REGEX.test(value)) {
        return 'Debe tener mayúscula, número y carácter especial';
      }
    }

    if (name === 'confirmPassword' && value !== values.password) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length === 0) {
      try {
        console.log("Enviando datos al backend...", formData);

        const response = await fetch('http://127.0.0.1:8000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: formData.nombre,
            apellido: formData.apellido,
            tipo_documento: formData.tipoDoc,
            numero_documento: formData.numDoc,
            direccion: formData.direccion,
            telefono: formData.telefono,
            correo: formData.email,
            password: formData.password
          }),
        });

        const data = await response.json();
        console.log("Respuesta del servidor:", data);

        if (response.ok) {
          setNotification({
            type: 'success',
            message: 'Tu cuenta fue guardada. Ya puedes iniciar sesión.'
          });
          window.setTimeout(onClose, 1600);
        } else {
          setNotification({
            type: 'error',
            message: data.mensaje || 'Ocurrió un error en el registro.'
          });
        }
      } catch (error) {
        console.error("Error detallado de conexión:", error);
        setNotification({
          type: 'error',
          message: 'No se pudo conectar con el servidor backend.'
        });
      }
    } else {
      setErrors(newErrors);
    }
  };

  // Fuerza visual de la contraseña (0 a 4)
  const getPasswordStrength = (value) => {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) score++;
    return score;
  };

  const strength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-lime-400', 'bg-emerald-400'];

  const inputClass = "w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25 transition-all";
  const labelClass = "block text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Notification notification={notification} onClose={() => setNotification(null)} />
      <div className="w-full max-w-4xl max-h-[95vh] bg-slate-900 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.18)] grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr]">

        {/* PANEL IZQUIERDO — MARCA */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-cyan-500/20 p-8 relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-neon-purple/20 blur-3xl" />
          <div className="absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-neon-blue/20 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon
                points="30,3 54,16 54,44 30,57 6,44 6,16"
                fill="#0f0f12"
                stroke="url(#neon-grad-modal)"
                strokeWidth="4"
              />
              <path
                d="M18 42V18L42 42V18"
                stroke="url(#neon-grad-modal)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="30" cy="30" r="3" fill="#2bf2fb" />
              <defs>
                <linearGradient id="neon-grad-modal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b535f6" />
                  <stop offset="100%" stopColor="#2bf2fb" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-2xl font-black tracking-wide whitespace-nowrap">
              <span className="text-white">NEXUS</span>
              <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                TECH
              </span>
            </span>
          </div>

          <div className="relative z-10">
            <h3 className="text-xl font-black text-white leading-snug mb-3">
              Únete a la<br />comunidad NEXUSTECH
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Crea tu cuenta y accede a lo mejor en hardware y tecnología gaming.
            </p>
          </div>

          <p className="relative z-10 text-slate-500 text-xs">
            © {new Date().getFullYear()} NexusTech
          </p>
        </div>

        {/* PANEL DERECHO — FORMULARIO */}
        <div className="p-6 sm:p-8 overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white text-2xl font-bold cursor-pointer leading-none"
          >
            &times;
          </button>

          {/* Logo compacto solo visible en móvil */}
          <div className="flex md:hidden items-center justify-center gap-2 mb-4">
            <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="30,3 54,16 54,44 30,57 6,44 6,16" fill="#0f0f12" stroke="url(#neon-grad-modal-m)" strokeWidth="4" />
              <path d="M18 42V18L42 42V18" stroke="url(#neon-grad-modal-m)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="30" cy="30" r="3" fill="#2bf2fb" />
              <defs>
                <linearGradient id="neon-grad-modal-m" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b535f6" />
                  <stop offset="100%" stopColor="#2bf2fb" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-black tracking-wide">
              <span className="text-white">NEXUS</span>
              <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">TECH</span>
            </span>
          </div>

          <h2 className="text-2xl font-black text-white mb-1 tracking-wide">Crear cuenta</h2>
          <p className="text-slate-400 text-sm mb-5">Completa tus datos para registrarte</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  maxLength={50}
                  className={inputClass}
                  placeholder="Tu nombre"
                />
                {errors.nombre && <span className="text-red-400 text-xs block mt-1">{errors.nombre}</span>}
              </div>
              <div>
                <label className={labelClass}>Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  maxLength={50}
                  className={inputClass}
                  placeholder="Tu apellido"
                />
                {errors.apellido && <span className="text-red-400 text-xs block mt-1">{errors.apellido}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>Tipo Doc.</label>
                <select
                  name="tipoDoc"
                  value={formData.tipoDoc}
                  onChange={handleChange}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="CC">Cédula Ciudadanía</option>
                  <option value="TI">Tarjeta Identidad</option>
                  <option value="CE">Cédula Extranjería</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Nº Documento</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="numDoc"
                  value={formData.numDoc}
                  onChange={handleChange}
                  onKeyDown={handleNumericKeyDown}
                  onPaste={handleNumericPaste}
                  maxLength={15}
                  className={inputClass}
                  placeholder="Solo números"
                />
                {errors.numDoc && <span className="text-red-400 text-xs block mt-1">{errors.numDoc}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  maxLength={150}
                  className={inputClass}
                  placeholder="Dirección"
                />
                {errors.direccion && <span className="text-red-400 text-xs block mt-1">{errors.direccion}</span>}
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  onKeyDown={handleNumericKeyDown}
                  onPaste={handleNumericPaste}
                  maxLength={10}
                  className={inputClass}
                  placeholder="Solo números"
                />
                {errors.telefono && <span className="text-red-400 text-xs block mt-1">{errors.telefono}</span>}
              </div>
            </div>

            <div>
              <label className={labelClass}>Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                maxLength={100}
                className={inputClass}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <span className="text-red-400 text-xs block mt-1">{errors.email}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  maxLength={64}
                  className={inputClass}
                  placeholder="••••••••"
                />
                {formData.password && (
                  <div className="flex gap-1 mt-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength ? strengthColors[strength] : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {errors.password && <span className="text-red-400 text-xs block mt-1">{errors.password}</span>}
              </div>
              <div>
                <label className={labelClass}>Confirmar</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  maxLength={64}
                  className={inputClass}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <span className="text-red-400 text-xs block mt-1">{errors.confirmPassword}</span>}
              </div>
            </div>

            <p className="text-slate-500 text-xs !mt-2">
              La contraseña debe tener mín. 8 caracteres, una mayúscula, un número y un carácter especial.
            </p>

            <button
              type="submit"
              className="w-full !mt-5 py-3 bg-cyan-400 text-slate-950 font-bold text-base rounded-lg hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)] cursor-pointer"
            >
              REGISTRARSE
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default RegisterModal;
