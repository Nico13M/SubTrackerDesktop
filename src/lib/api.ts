export const API_BASE: string = import.meta.env.PROD ? (import.meta as any).env?.VITE_API_BASE ?? '' : '';

// Return a URL suitable for fetch calls:
// - in production: full URL prefixed with VITE_API_BASE
// - in development: returns the relative path so Vite dev server proxy can apply
export function api(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  return API_BASE ? `${API_BASE}${path}` : path;
}

export default api;
