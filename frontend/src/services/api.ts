import axios from "axios";

const DEFAULT_API_URL = "http://localhost:4000";
const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;
const PROTOCOL_RELATIVE_PATTERN = /^\/\//;
const LEADING_SLASH_PATTERN = /^\/+/;

function ensureAbsoluteBaseUrl(url: string) {
  if (HTTP_PROTOCOL_PATTERN.test(url)) {
    return url;
  }

  if (PROTOCOL_RELATIVE_PATTERN.test(url)) {
    return `https:${url}`;
  }

  return `https://${url}`;
}

function normalizeBaseUrl(url?: string) {
  const rawValue = url?.trim();
  const sanitizedValue =
    rawValue && !PROTOCOL_RELATIVE_PATTERN.test(rawValue)
      ? rawValue.replace(LEADING_SLASH_PATTERN, "")
      : rawValue;
  const value = sanitizedValue
    ? ensureAbsoluteBaseUrl(sanitizedValue)
    : DEFAULT_API_URL;
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
