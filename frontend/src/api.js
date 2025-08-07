// URL base del backend. Puedes sobreescribirla con la variable de entorno VITE_API al compilar con Vite.
const API = import.meta.env.VITE_API?.replace(/\/$/, '') || 'http://localhost:8000'

// Export API_BASE_URL for use in other components
export const API_BASE_URL = API;

export async function getSongs() {
  // cache en localStorage durante 10 min para evitar peticiones redundantes
  const cacheKey = 'songs_cache_v1';
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < 10 * 60 * 1000) {
      return cached.data;
    }
  } catch {}

  const res = await fetch(`${API}/songs`);
  if (!res.ok) throw new Error('Error al obtener canciones');
  const data = await res.json();
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
  return data;
}

export async function uploadSong(title, mp3File, coverFile, description) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', mp3File);
  if (coverFile) formData.append('cover', coverFile);
  if (description) formData.append('description', description);

  const res = await fetch(`${API}/songs`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Error al subir canción');
  return res.json();
}

export function getSongFileUrl(id) {
  return `${API}/songs/${id}/file`;
}

export function getSongCoverUrl(id) {
  return `${API}/songs/${id}/cover`;
} 