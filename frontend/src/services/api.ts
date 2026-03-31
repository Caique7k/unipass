import axios from "axios";

const DEFAULT_API_URL = "http://localhost:4000";

function normalizeBaseUrl(url?: string) {
  const value = url?.trim() || DEFAULT_API_URL;
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
export default api;
