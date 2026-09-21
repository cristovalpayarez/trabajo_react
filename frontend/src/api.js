const API_URL = 'http://127.0.0.1:8000';

export async function obtenerMensajeBackend() {
  const respuesta = await fetch(`${API_URL}/`);

  if (!respuesta.ok) {
    throw new Error('No se pudo conectar con el backend');
  }

  return await respuesta.json();
}
