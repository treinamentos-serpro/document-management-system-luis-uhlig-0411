const apiPrefix = '/api';
export const currentUserId = import.meta.env.VITE_USER_ID || 'demo-user';

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('X-User-Id', currentUserId);

  const response = await fetch(`${apiPrefix}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Não foi possível concluir a operação.');
  }

  return response;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function getDocuments() {
  const response = await request('/documents');
  return response.json();
}

export async function downloadDocument(documentId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`);
  return response.blob();
}