import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';

import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/auth`;

const RecoverPassword = () => {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ==========================================
  // VALIDAR CORREO
  // ==========================================

  const handleEmailChange = (e) => {
    const value = e.target.value;

    setEmail(value);
    setError('');
    setMessage('');

    if (!value) {
      setError('El correo es requerido.');
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      setError('Formato de correo no válido.');
    }
  };

  // ==========================================
  // ENVIAR CÓDIGO
  // ==========================================

  const handleSendCode = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError('Por favor ingresa un correo válido.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/forgot-password`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            correo: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ||
          'No se pudo enviar el código.'
        );
      }

      setMessage(
        'Se ha enviado un código de recuperación a tu correo electrónico.'
      );

      setStep(2);

    } catch (error) {
      console.error(
        'Error enviando código:',
        error
      );

      setError(
        error.message ||
        'No se pudo enviar el código.'
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VERIFICAR CÓDIGO
  // ==========================================

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!code || code.length !== 6) {
      setError(
        'El código debe tener 6 dígitos.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-reset-code`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            correo: email.trim(),
            codigo: code.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ||
          'El código no es válido.'
        );
      }

      setMessage(
        'Código verificado correctamente.'
      );

      setStep(3);

    } catch (error) {
      console.error(
        'Error verificando código:',
        error
      );

      setError(
        error.message ||
        'El código no es válido.'
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CAMBIAR CONTRASEÑA
  // ==========================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError(
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        'Las contraseñas no coinciden.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/reset-password`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            correo: email.trim(),
            codigo: code.trim(),
            nuevaPassword: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ||
          'No se pudo cambiar la contraseña.'
        );
      }

      setMessage(
        '¡Contraseña actualizada correctamente!'
      );

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error(
        'Error cambiando contraseña:',
        error
      );

      setError(
        error.message ||
        'No se pudo cambiar la contraseña.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">

      <div className="bg-gaming-card p-8 rounded-2xl border border-neon-blue/40 shadow-[0_0_20px_rgba(43,242,251,0.2)] text-left">

        {/* ================================= */}
        {/* TÍTULO */}
        {/* ================================= */}

        <h2 className="text-2xl font-extrabold text-white mb-2">
          Recuperar{' '}
          <span className="text-neon-blue">
            Contraseña
          </span>
        </h2>

        <p className="text-gray-400 text-sm mb-6">

          {step === 1 &&
            'Ingresa tu correo registrado para recibir un código.'}

          {step === 2 &&
            'Ingresa el código de 6 dígitos que recibiste en tu correo.'}

          {step === 3 &&
            'Crea una nueva contraseña para tu cuenta.'}

        </p>


        {/* ================================= */}
        {/* MENSAJE */}
        {/* ================================= */}

        {message && (
          <div className="mb-4 p-3 bg-neon-blue/20 border border-neon-blue text-neon-blue text-sm rounded-lg">
            {message}
          </div>
        )}


        {/* ================================= */}
        {/* ERROR */}
        {/* ================================= */}

        {error && (
          <div className="mb-4 p-3 bg-neon-pink/20 border border-neon-pink text-neon-pink text-sm rounded-lg">
            {error}
          </div>
        )}


        {/* ================================= */}
        {/* PASO 1 - CORREO */}
        {/* ================================= */}

        {step === 1 && (

          <form
            onSubmit={handleSendCode}
            className="space-y-4"
          >

            <Input
              label="Correo Electrónico"
              type="email"
              name="email"
              value={email}
              onChange={handleEmailChange}
              error=""
              placeholder="tu-correo@ejemplo.com"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading
                ? 'Enviando código...'
                : 'Enviar Código'}
            </Button>

          </form>

        )}


        {/* ================================= */}
        {/* PASO 2 - CÓDIGO */}
        {/* ================================= */}

        {step === 2 && (

          <form
            onSubmit={handleVerifyCode}
            className="space-y-4"
          >

            <div>

              <label className="block text-sm font-bold text-gray-300 mb-2">
                Código de recuperación
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const value =
                    e.target.value.replace(/\D/g, '');

                  setCode(value);
                  setError('');
                }}
                placeholder="123456"
                className="w-full p-4 text-center text-2xl tracking-[0.4em] bg-gray-900 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-neon-blue"
              />

            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading
                ? 'Verificando...'
                : 'Verificar Código'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setCode('');
                setError('');
                setMessage('');
              }}
              className="w-full text-sm text-neon-purple hover:underline font-semibold"
            >
              ← Cambiar correo
            </button>

          </form>

        )}


        {/* ================================= */}
        {/* PASO 3 - NUEVA CONTRASEÑA */}
        {/* ================================= */}

        {step === 3 && (

          <form
            onSubmit={handleResetPassword}
            className="space-y-4"
          >

            <Input
              label="Nueva Contraseña"
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError('');
              }}
              error=""
              placeholder="Mínimo 6 caracteres"
            />

            <Input
              label="Confirmar Contraseña"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              error=""
              placeholder="Repite tu contraseña"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading
                ? 'Actualizando...'
                : 'Cambiar Contraseña'}
            </Button>

          </form>

        )}


        {/* ================================= */}
        {/* VOLVER AL LOGIN */}
        {/* ================================= */}

        <div className="mt-6 text-center">

          <Link
            to="/login"
            className="text-sm text-neon-purple hover:underline font-semibold"
          >
            ← Regresar al Inicio de Sesión
          </Link>

        </div>

      </div>

    </div>
  );
};

export default RecoverPassword;
