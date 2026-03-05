// API Configuration
// In production (Vercel), API calls go through the proxy rewrite (same domain),
// so we use an empty string. Locally, we point to the backend dev server.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000')

export default API_URL
