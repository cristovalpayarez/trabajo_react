import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import CarritoModal from './CarritoModal';
import CarritoButton from './CarritoButton';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [showCarrito, setShowCarrito] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserDropdown(false);
    navigate('/');
  };

  const linkStyle = ({ isActive }) =>
    `text-lg sm:text-xl font-bold transition-colors duration-300 ${
      isActive
        ? 'text-neon-blue drop-shadow-[0_0_8px_rgba(43,242,251,0.8)]'
        : 'text-gray-300 hover:text-neon-purple'
    }`;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gaming-dark/95 backdrop-blur-md border-b border-neon-purple/30 shadow-[0_4px_20px_rgba(181,53,246,0.15)]">
      <div className="w-full px-6 sm:px-12">
        <div className="flex justify-between items-center h-24">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer shrink-0">
            <svg
              width="44"
              height="44"
              viewBox="0 0 60 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                points="30,3 54,16 54,44 30,57 6,44 6,16"
                fill="#0f0f12"
                stroke="url(#neon-grad-header)"
                strokeWidth="4"
              />
              <path
                d="M18 42V18L42 42V18"
                stroke="url(#neon-grad-header)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="30" cy="30" r="3" fill="#2bf2fb" />
              <defs>
                <linearGradient id="neon-grad-header" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b535f6" />
                  <stop offset="100%" stopColor="#2bf2fb" />
                </linearGradient>
              </defs>
            </svg>

            <span className="text-2xl sm:text-3xl font-black tracking-wide whitespace-nowrap">
              <span className="text-white">NEXUS</span>
              <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                TECH
              </span>
            </span>
          </Link>

          {/* NAVEGACIÓN */}
          <nav className="hidden md:flex space-x-10 items-center">
            <NavLink to="/" className={linkStyle}>
              Inicio
            </NavLink>
            <NavLink to="/quienes-somos" className={linkStyle}>
              ¿Quiénes Somos?
            </NavLink>
            <NavLink to="/catalogo" className={linkStyle}>
              Catálogo
            </NavLink>
          </nav>

          {/* CARRITO BADGE */}
          <div className="relative">
            <CarritoButton onClick={() => setShowCarrito(true)} />
          </div>

          {/* USUARIO */}
          <div className="hidden md:flex items-center space-x-4 relative">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gaming-card border border-neon-purple text-white font-bold text-lg hover:shadow-[0_0_15px_rgba(181,53,246,0.5)] transition-all cursor-pointer"
                >
                  <span className="w-3 h-3 rounded-full bg-neon-blue animate-pulse"></span>
                  <span> Bienvenido, {user.nombre}!</span>
                  <span className="text-xs">▼</span>
                </button>

                {userDropdown && (
                  <div className="absolute right-0 mt-3 w-52 bg-gaming-card border border-neon-purple rounded-2xl shadow-2xl py-3 z-50 text-left">
                    <div className="px-4 py-2 border-b border-gray-800">
                      <p className="text-xs text-gray-400">Sesión iniciada como:</p>
                      <p className="text-sm font-bold text-neon-blue truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to={user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/empleado' : '/client-dashboard'}
                      onClick={() => setUserDropdown(false)}
                      className="block w-full text-left px-4 py-2.5 text-base text-neon-blue hover:bg-gaming-dark transition-colors font-bold cursor-pointer"
                    >
                      🏠 Mi Panel
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-base text-neon-pink hover:bg-gaming-dark transition-colors font-bold cursor-pointer"
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-xl font-bold text-lg border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-gaming-dark transition-all duration-300 shadow-[0_0_10px_rgba(43,242,251,0.3)] hover:shadow-[0_0_20px_rgba(43,242,251,0.8)]"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* BOTÓN CARRITO (MÓVIL) */}
          <button
            onClick={() => setShowCarrito(true)}
            className="md:hidden text-gray-300 hover:text-neon-blue focus:outline-none cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>

          {/* BOTÓN MENÚ MÓVIL */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-300 hover:text-neon-pink focus:outline-none cursor-pointer"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {showCarrito && <CarritoModal onClose={() => setShowCarrito(false)} />}

      {/* MENÚ MÓVIL */}
      {isOpen && (
        <div className="md:hidden bg-gaming-card border-b border-neon-pink/30 px-6 py-6 space-y-5 text-left">
          <NavLink to="/" onClick={() => setIsOpen(false)} className="block py-2 text-xl font-bold text-gray-200">
            Inicio
          </NavLink>
          <NavLink to="/quienes-somos" onClick={() => setIsOpen(false)} className="block py-2 text-xl font-bold text-gray-200">
            ¿Quiénes Somos?
          </NavLink>
          <NavLink to="/catalogo" onClick={() => setIsOpen(false)} className="block py-2 text-xl font-bold text-gray-200">
            Catálogo
          </NavLink>

          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/empleado' : '/client-dashboard'}
                onClick={() => setIsOpen(false)}
                className="block w-full py-3 text-center rounded-xl font-bold bg-gaming-card border border-neon-blue text-neon-blue text-lg cursor-pointer"
              >
                🏠 Mi Panel
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full py-3.5 rounded-xl font-bold bg-neon-pink text-white text-center text-lg cursor-pointer"
              >
                Cerrar Sesión ({user.nombre})
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block text-center w-full py-3.5 rounded-xl font-bold text-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-[0_0_15px_rgba(181,53,246,0.4)]"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
