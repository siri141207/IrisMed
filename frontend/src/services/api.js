const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    throw new Error(data?.detail || `IrisMed API error (${response.status}).`);
  }
  return data;
}

export async function getHealth() {
  return handleResponse(await fetch(`${API_BASE_URL}/health`));
}

export async function getDocuments() {
  return handleResponse(await fetch(`${API_BASE_URL}/documents`));
}

export async function getDocument(documentId) {
  return handleResponse(await fetch(`${API_BASE_URL}/documents/${documentId}`));
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  return handleResponse(await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  }));
}

export async function askQuestion(documentId, question, language = "English") {
  return handleResponse(await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: Number(documentId), question, language }),
  }));
}

export async function deleteDocument(documentId) {
  return handleResponse(await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: "DELETE",
  }));
}

export function documentFileUrl(documentId) {
  return `${API_BASE_URL}/documents/${documentId}/file`;
}
