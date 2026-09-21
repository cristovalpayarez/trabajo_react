import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegisterModal from '../components/RegisterModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [isRegisterModalOpen, setIsRegisterModalOpen] =
    useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // ==========================================
  // VALIDAR CORREO
  // ==========================================

  const handleEmailChange = (e) => {
    const value = e.target.value;

    setEmail(value);

    if (!value.trim()) {
      setEmailError(
        'El correo electrónico es obligatorio.'
      );
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError(
        'Ingresa un formato de correo válido (ej: usuario@correo.com).'
      );
    } else {
      setEmailError('');
    }
  };

  // ==========================================
  // VALIDAR CONTRASEÑA
  // ==========================================

  const handlePasswordChange = (e) => {
    const value = e.target.value;

    setPassword(value);

    if (!value) {
      setPasswordError(
        'La contraseña es obligatoria.'
      );
    } else if (value.length < 6) {
      setPasswordError(
        'La contraseña debe tener al menos 6 caracteres.'
      );
    } else {
      setPasswordError('');
    }
  };

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralError('');

    // Validaciones
    if (
      !email.trim() ||
      !password ||
      emailError ||
      passwordError
    ) {
      setGeneralError(
        'Por favor, completa correctamente todos los campos.'
      );

      return;
    }

    try {

      // ========================================
      // LOGIN
      // ========================================

      const loggedUser = await login(
        email.trim(),
        password
      );

      // ========================================
      // VERIFICAR USUARIO
      // ========================================

      if (!loggedUser) {
        setGeneralError(
          'No se pudo iniciar sesión.'
        );

        return;
      }

      // ========================================
      // ADMINISTRADOR
      // ========================================

      if (loggedUser.role === 'admin') {
        navigate('/admin');
        return;
      }

      if (loggedUser.role === 'employee') {
        navigate('/empleado');
        return;
      }

      // ========================================
      // CLIENTE
      // ========================================

      if (loggedUser.role === 'customer') {
        navigate('/client-dashboard');
        return;
      }

      // ========================================
      // ROL DESCONOCIDO
      // ========================================

      navigate('/');

    } catch (error) {

      console.error(
        'Error detallado al iniciar sesión:',
        error
      );

      setGeneralError(
        error.message ||
        'Error al iniciar sesión. Verifica tus credenciales.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gaming-dark p-6">

      <div className="w-full max-w-lg bg-gaming-card/95 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-neon-purple/50 shadow-[0_0_40px_rgba(181,53,246,0.2)]">

        {/* ====================================== */}
        {/* LOGO */}
        {/* ====================================== */}

        <div className="flex justify-center mb-8">

          <Link
            to="/"
            className="cursor-pointer"
          >

            <svg
              width="220"
              height="55"
              viewBox="0 0 250 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >

              <g transform="translate(5, 5)">

                <polygon
                  points="30,3 54,16 54,44 30,57 6,44 6,16"
                  fill="#0f0f12"
                  stroke="url(#gradient-neon-login)"
                  strokeWidth="4"
                />

                <path
                  d="M18 42V18L42 42V18"
                  stroke="url(#gradient-neon-login)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle
                  cx="30"
                  cy="30"
                  r="3"
                  fill="#2bf2fb"
                />

              </g>

              <text
                x="75"
                y="40"
                fontFamily="Arial"
                fontSize="22"
                fontWeight="900"
                fill="white"
                letterSpacing="1"
              >
                NEXUS
              </text>

              <text
                x="160"
                y="40"
                fontFamily="Arial"
                fontSize="22"
                fontWeight="900"
                fill="url(#gradient-neon-login)"
                letterSpacing="1"
              >
                TECH
              </text>

              <defs>

                <linearGradient
                  id="gradient-neon-login"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >

                  <stop
                    offset="0%"
                    stopColor="#b535f6"
                  />

                  <stop
                    offset="100%"
                    stopColor="#2bf2fb"
                  />

                </linearGradient>

              </defs>

            </svg>

          </Link>

        </div>

        {/* ====================================== */}
        {/* TÍTULO */}
        {/* ====================================== */}

        <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-2">
          Iniciar Sesión
        </h2>

        <p className="text-base sm:text-lg text-gray-400 text-center mb-8">
          Accede al núcleo de tu equipamiento gamer.
        </p>

        {/* ====================================== */}
        {/* ERROR GENERAL */}
        {/* ====================================== */}

        {generalError && (

          <div className="mb-6 p-4 bg-neon-pink/20 border border-neon-pink text-neon-pink rounded-xl text-center font-bold">
            {generalError}
          </div>

        )}

        {/* ====================================== */}
        {/* FORMULARIO */}
        {/* ====================================== */}

        <form
          className="space-y-6"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* ==================================== */}
          {/* CORREO */}
          {/* ==================================== */}

          <div>

            <label className="block text-lg font-bold text-gray-300 mb-2">
              Correo Electrónico
            </label>

            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`w-full p-4 text-lg bg-gray-900 border-2 rounded-xl text-white focus:outline-none transition-all ${
                emailError
                  ? 'border-neon-pink'
                  : 'border-gray-700 focus:border-neon-blue'
              }`}
              placeholder="ejemplo@correo.com"
              required
            />

            {emailError && (

              <p className="mt-2 text-sm text-neon-pink font-bold">
                ⚠️ {emailError}
              </p>

            )}

          </div>

          {/* ==================================== */}
          {/* CONTRASEÑA */}
          {/* ==================================== */}

          <div>

            <label className="block text-lg font-bold text-gray-300 mb-2">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className={`w-full p-4 text-lg bg-gray-900 border-2 rounded-xl text-white focus:outline-none transition-all ${
                passwordError
                  ? 'border-neon-pink'
                  : 'border-gray-700 focus:border-neon-blue'
              }`}
              placeholder="••••••••"
              required
            />

            {passwordError && (

              <p className="mt-2 text-sm text-neon-pink font-bold">
                ⚠️ {passwordError}
              </p>

            )}

          </div>

          {/* ==================================== */}
          {/* RECORDAR / RECUPERAR */}
          {/* ==================================== */}

          <div className="flex items-center justify-between text-base">

            <label className="flex items-center space-x-3 cursor-pointer text-gray-300">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
                className="w-5 h-5 accent-neon-blue rounded bg-gray-900 border-gray-700 cursor-pointer"
              />

              <span>
                Recordar mis datos
              </span>

            </label>

          <Link
            to="/recuperar-password"
            className="text-neon-blue hover:underline font-bold"
          >
            ¿Olvidaste tu contraseña?
          </Link>

          </div>

          {/* ==================================== */}
          {/* BOTÓN */}
          {/* ==================================== */}

          <button
            type="submit"
            className="w-full py-4 text-xl font-black bg-neon-blue text-black rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(43,242,251,0.4)] cursor-pointer mt-4"
          >
            ENTRAR
          </button>

        </form>

        {/* ====================================== */}
        {/* REGISTRO */}
        {/* ====================================== */}

        <p className="mt-8 text-center text-lg text-gray-400">

          ¿No tienes cuenta?{' '}

          <button
            type="button"
            onClick={() =>
              setIsRegisterModalOpen(true)
            }
            className="text-neon-purple font-bold hover:underline focus:outline-none cursor-pointer"
          >
            Regístrate aquí
          </button>

        </p>

      </div>

      {/* ====================================== */}
      {/* MODAL REGISTRO */}
      {/* ====================================== */}

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() =>
          setIsRegisterModalOpen(false)
        }
      />

    </div>
  );
};

export default Login;
