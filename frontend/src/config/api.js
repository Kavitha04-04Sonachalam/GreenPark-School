import axios from "axios";
import { getApiBaseUrl } from "../config";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

const uppercasePayloadStrings = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(uppercasePayloadStrings);
  }
  if (typeof obj === 'object') {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const kLower = key.toLowerCase();
      if (
        typeof value === 'string' &&
        !kLower.includes('password') &&
        !kLower.includes('email') &&
        !kLower.includes('url') &&
        !kLower.includes('token')
      ) {
        newObj[key] = value.toUpperCase();
      } else if (typeof value === 'object' && value !== null) {
        newObj[key] = uppercasePayloadStrings(value);
      } else {
        newObj[key] = value;
      }
    }
    return newObj;
  }
  return obj;
};

// Dynamically resolve base URL on each request, inject auth token, and ensure text fields are in UPPERCASE
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const urlLower = (config.url || '').toLowerCase();
  const isAuthRoute = urlLower.includes('/login') || urlLower.includes('/token') || urlLower.includes('/password') || urlLower.includes('/auth');
  if (!isAuthRoute && config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
    config.data = uppercasePayloadStrings(config.data);
  }
  return config;
});

export default api;
