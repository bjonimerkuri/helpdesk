/**
 * The API is always same-origin under /api: the Angular dev server proxies it to localhost:3001
 * (proxy.conf.json) and Vercel rewrites it to the serverless function. No CORS, no per-env URLs.
 */
export const API_URL = '/api';
