import React, { useState, useRef, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy el asistente virtual de NEXUS TECH. Puedo ayudarte con productos, servicios, pedidos, facturas y PQR. ¿Qué necesitas saber?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sesionId, setSesionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // La sesión se guarda en localStorage para conservar el hilo de la
  // conversación (y su contexto en la IA) aunque el usuario recargue la página.
  useEffect(() => {
    const guardada = localStorage.getItem('chatbot_sesion');
    if (guardada) {
      setSesionId(guardada);
      return;
    }
    const nueva = 'web_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    localStorage.setItem('chatbot_sesion', nueva);
    setSesionId(nueva);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chatbot/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: userMsg, sesion_id: sesionId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.respuesta }]);
        if (data.sesion_id && !sesionId) {
          setSesionId(data.sesion_id);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Disculpa, hubo un error. Intenta de nuevo.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'No pude conectar con el servidor. Intenta mas tarde.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Boton flotante: queda justo ARRIBA del boton de WhatsApp */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ bottom: '98px', right: '24px' }}
        className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg transition hover:scale-110 hover:shadow-xl"
        title="Chat con asistente virtual"
      >
        <span className="text-2xl">{isOpen ? '✕' : '💬'}</span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0a1226] bg-emerald-400" />
        )}
      </button>

      {/* Ventana del chat */}
      {isOpen && (
        <div
          className="fixed right-6 z-50 flex w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0a1226] shadow-2xl"
          style={{ bottom: '170px', maxHeight: 'min(500px, calc(100vh - 200px))' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-600/20 to-violet-600/20 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-white">
              NT
            </div>
            <div>
              <p className="text-sm font-bold text-white">NEXUS TECH</p>
              <p className="flex items-center gap-1 text-xs text-emerald-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                En línea · Asistente IA
              </p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-400">
                  <span className="animate-pulse">Escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu pregunta sobre la tienda..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white transition hover:bg-cyan-500 disabled:opacity-40"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
