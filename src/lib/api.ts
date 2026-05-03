export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pawconnect-production-e486.up.railway.app';

export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Intelligence: Determine if we should use relative or absolute paths
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isRailway = window.location.hostname.includes('railway.app');
    
    // If we're on the same server (Local or Railway), use relative paths
    if (isLocalhost || isRailway) {
      return cleanPath;
    }
  }
  
  // For Cloudflare or other cross-origin deployments, use the absolute URL
  return `${API_BASE_URL}${cleanPath}`;
};
