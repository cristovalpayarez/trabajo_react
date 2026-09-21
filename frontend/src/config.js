// URL base del backend, configurable por entorno (Vite).
// En producción (Railway) se define VITE_API_URL con la URL pública del backend.
const rawBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Sin barra final para que `${API_BASE_URL}/api/...` siempre quede bien formado.
export const API_BASE_URL = String(rawBase).replace(/\/+$/, '');
