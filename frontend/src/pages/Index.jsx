import React from 'react';
import Carousel from '../components/Carousel';
import ProductGrid from '../components/ProductGrid';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="w-full space-y-16 py-8 px-4 sm:px-10">
      {/* Sección Hero */}
      <section className="text-center w-full space-y-4">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
          EQUÍPATE CON EL <br />
          <span className="bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(181,53,246,0.6)]">
            MÁXIMO RENDIMIENTO
          </span>
        </h1>
        <p className="text-gray-400 text-lg sm:text-xl">
          Laptops, smartphones y estaciones de trabajo diseñadas para ganar partidas y dominar tu jornada laboral.
        </p>
      </section>

      {/* Carrusel en Ancho Completo */}
      <section className="w-full">
        <Carousel />
      </section>

      {/* Catálogo de Productos */}
      <section className="w-full">
        <ProductGrid />
      </section>

      {/* Tarjetas Informativas en Ancho Completo */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gaming-card p-8 rounded-2xl border border-neon-purple/40 hover:border-neon-purple transition-all duration-300 shadow-[0_0_15px_rgba(181,53,246,0.2)] text-left">
          <div className="text-4xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-white mb-2">Zona Gaming RGB</h2>
          <p className="text-gray-400 mb-6">Laptops con tarjetas gráficas RTX Serie 40 y pantallas de alta tasa de refresco.</p>
          <Link to="/login"><Button variant="primary">Explorar Catálogo Gamer</Button></Link>
        </div>

        <div className="bg-gaming-card p-8 rounded-2xl border border-neon-blue/40 hover:border-neon-blue transition-all duration-300 shadow-[0_0_15px_rgba(43,242,251,0.2)] text-left">
          <div className="text-4xl mb-4">💻</div>
          <h2 className="text-2xl font-bold text-white mb-2">Productividad & Trabajo</h2>
          <p className="text-gray-400 mb-6">Workstations ligeras, procesadores multitarea y pantallas de alta fidelidad.</p>
          <Link to="/login"><Button variant="secondary">Ver Equipos de Trabajo</Button></Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
