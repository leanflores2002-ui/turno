// Lee la URL base de la API desde una meta tag en index.html
// <meta name="api-base-url" content="%NG_APP_API_BASE_URL%">
const meta = document.querySelector('meta[name="api-base-url"]') as HTMLMetaElement | null;
export const API_BASE_URL = (meta?.content?.trim() || 'http://localhost:8000/api/v1');

export const environment = {
  apiBaseUrl: API_BASE_URL,
};
