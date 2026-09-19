// Dynamically resolve API URL:
// 1. If VITE_API_URL is set (e.g. Cloud deployment on Vercel pointing to Render/Railway), use it.
// 2. Otherwise return '' to use native proxying via Vite or local web server.
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
