import React, { useEffect } from 'react';

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const success = notification.type !== 'error';

  return (
    <div className="fixed top-28 right-6 z-[200] w-[min( calc(100vw-3rem), 380px)]">
      <div className={`rounded-2xl border p-4 shadow-[0_0_30px_rgba(43,242,251,0.25)] backdrop-blur-md ${
        success
          ? 'border-neon-blue/70 bg-gaming-card/95'
          : 'border-neon-pink/70 bg-gaming-card/95'
      }`}>
        <div className="flex items-start gap-3">
          <span className={`text-2xl ${success ? 'text-neon-blue' : 'text-neon-pink'}`}>
            {success ? '✓' : '⚠'}
          </span>
          <div className="flex-1">
            <p className={`font-black ${success ? 'text-neon-blue' : 'text-neon-pink'}`}>
              {success ? 'Operación exitosa' : 'No se pudo completar'}
            </p>
            <p className="mt-1 text-sm text-gray-200">{notification.message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;

