import React from 'react';

const QuienesSomos = () => {
  const valores = [
    {
      titulo: 'Calidad',
      descripcion: 'Seleccionamos cada producto bajo estrictos estándares de rendimiento y durabilidad.',
      color: 'text-neon-blue',
      borde: 'border-neon-blue/40'
    },
    {
      titulo: 'Innovación',
      descripcion: 'Estamos siempre a la vanguardia de las últimas tecnologías del mercado gamer y profesional.',
      color: 'text-neon-purple',
      borde: 'border-neon-purple/40'
    },
    {
      titulo: 'Confianza',
      descripcion: 'Construimos relaciones duraderas con nuestros clientes basadas en la transparencia y el soporte real.',
      color: 'text-neon-pink',
      borde: 'border-neon-pink/40'
    },
    {
      titulo: 'Pasión',
      descripcion: 'Somos gamers y profesionales tech; entendemos exactamente lo que nuestros clientes necesitan.',
      color: 'text-neon-blue',
      borde: 'border-neon-blue/40'
    }
  ];

  return (
    <div className="min-h-screen bg-gaming-dark text-white">

      {/* ====================================== */}
      {/* HERO */}
      {/* ====================================== */}

      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-black">
          ¿Quiénes <span className="text-neon-purple">Somos?</span>
        </h1>

        <p className="text-neon-blue font-semibold mt-4 text-lg sm:text-xl max-w-2xl mx-auto">
          Líderes en tecnología gaming y soluciones de cómputo profesional.
        </p>
      </div>

      {/* ====================================== */}
      {/* HISTORIA */}
      {/* ====================================== */}

      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-gaming-card border border-neon-purple/30 rounded-2xl p-8 sm:p-10 shadow-[0_0_30px_rgba(181,53,246,0.1)]">
          <h2 className="text-2xl font-black text-white mb-4">
            Nuestra <span className="text-neon-purple">Historia</span>
          </h2>

          <div className="space-y-4 text-gray-300 leading-relaxed text-base sm:text-lg">
            <p>
              En <strong className="text-white">NEXUS TECH</strong>, nacimos con el objetivo de eliminar
              las fronteras entre el trabajo de alto nivel y el entretenimiento sin límites.
            </p>

            <p>
              Desde nuestros inicios, nos hemos dedicado a ofrecer componentes, laptops y workstations
              de última generación, entendiendo que detrás de cada equipo hay un gamer, un creador de
              contenido o un profesional que exige lo máximo de su tecnología.
            </p>

            <p>
              Hoy trabajamos con proveedores certificados y un equipo técnico especializado, para
              garantizar que cada producto que llega a tus manos cumpla con los más altos estándares
              de calidad y rendimiento.
            </p>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* MISIÓN Y VISIÓN */}
      {/* ====================================== */}

      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-gaming-card p-8 rounded-2xl border border-neon-pink/40 shadow-[0_0_20px_rgba(255,45,149,0.1)]">
            <h3 className="text-neon-pink font-black text-2xl mb-3">
              🎯 Misión
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Proveer hardware de vanguardia con los más altos estándares de calidad, respaldados
              por un soporte técnico especializado, para que gamers y profesionales alcancen el
              máximo rendimiento en cada proyecto o partida.
            </p>
          </div>

          <div className="bg-gaming-card p-8 rounded-2xl border border-neon-blue/40 shadow-[0_0_20px_rgba(43,242,251,0.1)]">
            <h3 className="text-neon-blue font-black text-2xl mb-3">
              🚀 Visión
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Ser el e-commerce referente en la comunidad gamer y profesional del país para el año 2028,
              reconocidos por la calidad de nuestros productos, la rapidez de nuestro servicio y la
              cercanía con nuestros clientes.
            </p>
          </div>

        </div>
      </div>

      {/* ====================================== */}
      {/* VALORES */}
      {/* ====================================== */}

      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-white text-center mb-10">
          Nuestros <span className="text-neon-purple">Valores</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valores.map((valor, index) => (
            <div
              key={index}
              className={`bg-gaming-card p-6 rounded-xl border ${valor.borde} hover:shadow-[0_0_20px_rgba(181,53,246,0.15)] transition-all`}
            >
              <h4 className={`font-bold text-lg mb-2 ${valor.color}`}>
                {valor.titulo}
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                {valor.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ====================================== */}
      {/* POR QUÉ ELEGIRNOS */}
      {/* ====================================== */}

      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 border border-neon-purple/30 rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
            ¿Por qué elegir <span className="text-neon-blue">NEXUS TECH</span>?
          </h2>

          <p className="text-gray-300 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto">
            Combinamos productos de última generación, atención personalizada y garantía real
            de soporte técnico, para que tu experiencia de compra sea tan sólida como el
            equipo que estás adquiriendo.
          </p>
        </div>
      </div>

    </div>
  );
};

export default QuienesSomos;
