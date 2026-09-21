import React from 'react';

// Íconos SVG inline (sin dependencias externas)
const Icons = {
  Laptop: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M2 20h20"/></svg>,
  LifeBuoy: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24"/></svg>,
  ShieldCheck: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  Github: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
  Twitter: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C4 15.4 2.2 11 4 6c2.2 2.6 5.4 4.1 9 4.4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.6 3-1.6z"/></svg>,
  Instagram: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.4a4 4 0 1 1-7.9-1.1 4 4 0 0 1 7.9 1.1z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  Youtube: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49 49 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49 49 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><path d="m10 15 5-3-5-3z"/></svg>,
  ArrowUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
  Send: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
};
const { Laptop, LifeBuoy, ShieldCheck, Github, Twitter, Instagram, Youtube, ArrowUp, Send } = Icons;

const linkSections = [
  {
    title: 'Productos',
    icon: Laptop,
    links: ['Laptops', 'Smartphones', 'Workstations'],
  },
  {
    title: 'Soporte',
    icon: LifeBuoy,
    links: ['Centro de Ayuda', 'Garantía', 'Envíos'],
  },
  {
    title: 'Legal',
    icon: ShieldCheck,
    links: ['Términos', 'Privacidad', 'Cookies'],
  },
];

const socialLinks = [
  { icon: Github, label: 'Github', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/cristovalpayares' },
  { icon: Youtube, label: 'Youtube', href: '#' },
];

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative w-full bg-gaming-darker border-t border-neon-purple/20 pt-16 pb-8 px-6 sm:px-12 mt-10 overflow-hidden">
      {/* Glow decorativo de fondo */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-neon-purple/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">

        {/* Columna 1: Logo + descripción + redes + newsletter */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            {/* Isotipo en SVG, sin texto adentro para evitar problemas de posicionamiento */}
            <svg width="44" height="44" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="30,3 54,16 54,44 30,57 6,44 6,16" fill="#0f0f12" stroke="url(#gradient-neon-footer)" strokeWidth="4"/>
              <path d="M18 42V18L42 42V18" stroke="url(#gradient-neon-footer)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="30" cy="30" r="3" fill="#2bf2fb" />
              <defs>
                <linearGradient id="gradient-neon-footer" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b535f6" />
                  <stop offset="100%" stopColor="#2bf2fb" />
                </linearGradient>
              </defs>
            </svg>

            {/* Texto del logo en HTML: mucho más confiable que calcular x/y en SVG */}
            <span className="text-2xl sm:text-3xl font-black tracking-wide">
              <span className="text-white">NEXUS</span>
              <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">TECH</span>
            </span>
          </div>

          <p className="text-base sm:text-lg text-gray-400 max-w-sm mb-6">
            La mejor tecnología para dominar cada partida y cada proyecto.
          </p>

          {/* Redes sociales */}
          <div className="flex items-center gap-3 mb-8">
            {socialLinks.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href !== '#' ? '_blank' : undefined}
                rel={href !== '#' ? 'noopener noreferrer' : undefined}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-700 text-gray-400 hover:text-neon-blue hover:border-neon-blue hover:shadow-[0_0_12px_rgba(43,242,251,0.4)] transition-all duration-300"
              >
                <Icon width={18} height={18} />
              </a>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Recibe ofertas exclusivas</p>
            <form className="flex w-full max-w-sm rounded-lg overflow-hidden border border-gray-700 focus-within:border-neon-blue transition-colors">
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full bg-gaming-dark px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Suscribirse"
                className="px-4 bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition-opacity"
              >
                <Send width={18} height={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Columnas de Links */}
        {linkSections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx}>
              <h4 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-neon-blue mb-6">
                <Icon width={20} height={20} />
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className="group inline-flex items-center text-base sm:text-lg text-gray-300 hover:text-neon-pink transition-colors"
                    >
                      <span className="w-0 group-hover:w-2.5 h-px bg-neon-pink transition-all duration-300 mr-0 group-hover:mr-2"></span>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Copyright + botón volver arriba */}
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-800">
        <p className="text-sm sm:text-base text-gray-500 text-center sm:text-left">
          © 2026 NexusTech — Todos los derechos reservados.
        </p>

        <button
          onClick={scrollToTop}
          aria-label="Volver arriba"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gaming-dark border border-neon-purple/40 text-neon-purple hover:text-white hover:bg-neon-purple hover:shadow-[0_0_15px_rgba(181,53,246,0.5)] transition-all duration-300"
        >
          <ArrowUp width={18} height={18} />
        </button>
      </div>
    </footer>
  );
};

export default Footer;
