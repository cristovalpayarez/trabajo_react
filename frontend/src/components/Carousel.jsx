import React, { useState, useEffect } from 'react';

const carouselData = [
  {
    id: 1,
    title: 'ASUS ROG Strix SCAR 18',
    desc: 'Laptop Gaming con RTX 4090 y pantalla Nebula Display 240Hz.',
    img: 'https://dlcdnwebimgs.asus.com/gain/77387050-5133-4282-93AC-656739026015'
  },
  {
    id: 2,
    title: 'MacBook Pro M3 Max',
    desc: 'Potencia extrema para trabajo profesional, edición 8K y desarrollo.',
    img: 'https://http2.mlstatic.com/D_NQ_NP_974249-MCO93902598833_102025-O.webp'
  },
  {
    id: 3,
    title: 'ASUS ROG Phone 8 Pro',
    desc: 'El smartphone definitivo para gaming con gatillos ultrasónicos.',
    img: 'https://m.media-amazon.com/images/I/81pgjnb9pVL._AC_SX569_.jpg'
  },
  {
    id: 4,
    title: 'Lenovo Legion Pro 7i',
    desc: 'Rendimiento térmico de nivel industrial para largas jornadas de juego.',
    img: 'https://p1-ofp.static.pub//fes/cms/2024/09/12/q6fb2891avf5ok5et6ppuhuuilu0cq939626.png'
  },
  {
    id: 5,
    title: 'Samsung Galaxy S24 Ultra',
    desc: 'Cámara de 200MP, Snapdragon 8 Gen 3 y pantalla AMOLED de 120Hz.',
    img: 'https://exitocol.vteximg.com.br/arquivos/ids/34013570/Celular-SAMSUNG-S24-ULTRA-5G-256-GB-12-GB-RAM-GRIS-3489469_a.jpg?v=639192914531030000'
  },
  {
    id: 6,
    title: 'Dell XPS 16 Workstation',
    desc: 'Elegancia y rendimiento gráfico avanzado para creadores de contenido.',
    img: 'https://http2.mlstatic.com/D_NQ_NP_700964-MLA95498135511_102025-O.webp'
  },
  {
    id: 7,
    title: 'iPhone 15 Pro Max Titanium',
    desc: 'Construcción en titanio con chip A17 Pro para juegos AAA en tu mano.',
    img: 'https://www.celudmovil.com.co/cdn/shop/files/IPHONE15PROMAX_1_9032a5c2-a30d-4ab9-8390-6b2552e5d45a.webp?v=1708102395&width=1080'
  },
  {
    id: 8,
    title: 'MSI Raider GE78 HX',
    desc: 'Iluminación RGB Matrix en el chasis e Intel Core i9 de última generación.',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqelGlV6LctdCdGq2eKUs0DWOPh84q-3gkZwWLCMkBUQ&s=10'
  },
  {
    id: 9,
    title: 'Xiaomi 14 Ultra 5G',
    desc: 'Óptica Leica profesional y sistema de refrigeración líquida para gaming.',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRE_GGnoHTeSGXexVd7zK4Y32LMtsuDNFJOaNnIYEpQ5Q&s=10'
  },
  {
    id: 10,
    title: 'HP OMEN Transcend 14',
    desc: 'Chasis ultra delgado de aluminio con pantalla OLED de respuesta instantánea.',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5aOZW-he8XRYjQ-Nr36f4aZqsAwpotJvRIMRMR3ZcPg&s=10'
  }
];

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? carouselData.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev === carouselData.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === carouselData.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const current = carouselData[currentIndex];

  return (
    <div className="w-full px-3 sm:px-6">

      <div className="relative w-full overflow-hidden rounded-2xl border-2 border-neon-purple/50 shadow-[0_0_25px_rgba(181,53,246,0.3)]">

        {/* CONTENEDOR PRINCIPAL */}
        <div className="relative h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] w-full bg-gaming-dark overflow-hidden">

          {/* FONDO DESENFOCADO */}
          <img
            src={current.img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-2xl scale-110 opacity-40 pointer-events-none"
          />

          {/* IMAGEN PRINCIPAL */}
          <img
            src={current.img}
            alt={current.title}
            className="relative z-10 w-full h-full object-contain transition-all duration-700 ease-in-out"
          />

          {/* GRADIENTE */}
          <div className="absolute inset-0 bg-gradient-to-t from-gaming-dark via-gaming-dark/40 to-transparent pointer-events-none z-20"></div>

          {/* INFORMACIÓN DEL PRODUCTO */}
          <div className="absolute bottom-4 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-6 text-left p-4 sm:p-6 md:p-7 rounded-xl bg-gaming-dark/95 backdrop-blur-md border border-neon-blue/40 shadow-[0_0_25px_rgba(43,242,251,0.25)] z-30">

            <span className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-widest text-neon-blue mb-1.5 block">
              Producto {currentIndex + 1} de {carouselData.length}
            </span>

            <h3 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-wide">
              {current.title}
            </h3>

            <p className="text-sm sm:text-base md:text-lg text-gray-200 mt-2 font-medium">
              {current.desc}
            </p>

          </div>

        </div>

        {/* BOTÓN ANTERIOR */}
        <button
          onClick={prevSlide}
          aria-label="Producto anterior"
          className="absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 p-2.5 sm:p-4 rounded-full bg-gaming-dark/80 text-white hover:text-neon-pink hover:border-neon-pink border border-gray-600 transition-all duration-300 backdrop-blur-md z-40 text-base sm:text-lg font-bold"
        >
          ❮
        </button>

        {/* BOTÓN SIGUIENTE */}
        <button
          onClick={nextSlide}
          aria-label="Producto siguiente"
          className="absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 p-2.5 sm:p-4 rounded-full bg-gaming-dark/80 text-white hover:text-neon-pink hover:border-neon-pink border border-gray-600 transition-all duration-300 backdrop-blur-md z-40 text-base sm:text-lg font-bold"
        >
          ❯
        </button>

        {/* INDICADORES */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-40">

          {carouselData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir al producto ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 bg-neon-purple shadow-[0_0_8px_#b535f6]'
                  : 'w-2.5 bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}

        </div>

      </div>

    </div>
  );
};

export default Carousel;
