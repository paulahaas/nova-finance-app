// Same-origin by default: in production the API is a Vercel Function under
// /api on the same domain, and in dev vite.config.js proxies /api to the
// local Express server. Set VITE_API_URL only to point somewhere else.
export const API_URL = import.meta.env.VITE_API_URL ?? '';
