const API = 'http://127.0.0.1:8000';

export async function getSongs() {
  const res = await fetch(`${API}/songs`);
  if (!res.ok) throw new Error('Error al obtener canciones');
  return res.json();
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