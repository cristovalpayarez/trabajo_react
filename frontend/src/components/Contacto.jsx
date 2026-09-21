import React from 'react';

const Contacto = () => {
  return (
    <div className="min-h-screen bg-gaming-dark py-24 px-6 sm:px-12 max-w-3xl mx-auto text-white">
      <h2 className="text-4xl sm:text-6xl font-black text-center mb-6">
        Ponte en <span className="text-neon-pink">Contacto</span>
      </h2>
      <p className="text-lg text-gray-400 text-center mb-10">¿Tienes dudas con tu pedido o necesitas asesoría gaming? Escríbenos.</p>
      
      <div className="bg-gaming-card p-8 sm:p-12 rounded-3xl border border-neon-purple/40 shadow-[0_0_30px_rgba(181,53,246,0.15)]">
        <form className="space-y-6">
          <div>
            <label className="block text-lg font-bold text-gray-300 mb-2">Tu Nombre</label>
            <input type="text" placeholder="Ej. Carlos Gamer" className="w-full p-4 text-lg bg-gray-900 border-2 border-gray-700 rounded-xl text-white focus:border-neon-blue focus:outline-none" />
          </div>
          <div>
            <label className="block text-lg font-bold text-gray-300 mb-2">Correo Electrónico</label>
            <input type="email" placeholder="correo@ejemplo.com" className="w-full p-4 text-lg bg-gray-900 border-2 border-gray-700 rounded-xl text-white focus:border-neon-blue focus:outline-none" />
          </div>
          <div>
            <label className="block text-lg font-bold text-gray-300 mb-2">Mensaje</label>
            <textarea placeholder="¿En qué podemos ayudarte?" className="w-full p-4 text-lg bg-gray-900 border-2 border-gray-700 rounded-xl text-white focus:border-neon-blue focus:outline-none h-36"></textarea>
          </div>
          <button type="button" onClick={() => alert('¡Mensaje enviado con éxito!')} className="w-full py-5 text-xl font-black bg-neon-pink text-white rounded-xl hover:opacity-90 transition-all shadow-[0_0_15px_rgba(255,0,128,0.4)]">
            ENVIAR MENSAJE
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contacto;
