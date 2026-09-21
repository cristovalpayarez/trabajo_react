import { API_BASE_URL } from './config';

export async function obtenerMensajeBackend() {
  const respuesta = await fetch(`${API_BASE_URL}/`);

  if (!respuesta.ok) {
    throw new Error('No se pudo conectar con el backend');
  }

  return await respuesta.json();
}
