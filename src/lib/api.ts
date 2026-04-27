export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pawconnect-production-e486.up.railway.app';

export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const finalUrl = `${API_BASE_URL}${cleanPath}`;
  console.log(`[API Call] ${finalUrl}`);
  return finalUrl;
};
