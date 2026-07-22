const apiRoot = (import.meta.env.VITE_API_URL || 'https://bouguedima-studio-1.onrender.com').replace(/\/$/, '')

/** API prefix: `https://bouguedima-studio-1.onrender.com/api` */
export const API = `${apiRoot}/api`

/** Origin for static uploads when frontend and backend are on different hosts */
export const ASSET_BASE = apiRoot || ''

export const assetUrl = (path) => `${ASSET_BASE}${path.startsWith('/') ? path : `/${path}`}`
