const runtimeBaseUrl = (window as any)?.__env?.API_BASE_URL as string | undefined;
export const API_BASE_URL = runtimeBaseUrl || 'http://localhost:8000/api/v1';
