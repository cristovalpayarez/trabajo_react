import React from 'react';
import Input from '../components/Input';
import Button from '../components/Button';

const Contacto = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('¡Mensaje enviado con éxito! Te responderemos pronto.');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-gaming-card p-8 rounded-2xl border border-neon-blue/30 shadow-[0_0_20px_rgba(43,242,251,0.15)] text-left">
        <h1 className="text-3xl font-extrabold text-white mb-2">
          Ponte en <span className="text-neon-blue">Contacto</span>
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          ¿Tienes dudas sobre qué equipo elegir para tu trabajo o tus juegos? Escríbenos.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre Completo" name="fullName" placeholder="Ej. Juan Pérez" />
          <Input label="Correo Electrónico" type="email" name="email" placeholder="correo@ejemplo.com" />
          
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-300">Mensaje</label>
            <textarea
              rows="4"
              className="w-full px-4 py-3 bg-gaming-dark text-white rounded-lg border border-gray-700 focus:border-neon-blue focus:shadow-[0_0_12px_rgba(43,242,251,0.6)] focus:outline-none transition-all duration-300"
              placeholder="¿En qué te podemos ayudar?"
            ></textarea>
          </div>

          <Button type="submit" variant="primary">Enviar Mensaje</Button>
        </form>
      </div>
    </div>
  );
};

export default Contacto;
