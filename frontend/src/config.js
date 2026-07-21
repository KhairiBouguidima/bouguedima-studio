const apiRoot = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

/** API prefix: `/api` locally, `https://api.example.com/api` on Vercel */
export const API = apiRoot ? `${apiRoot}/api` : '/api'

/** Origin for static uploads when frontend and backend are on different hosts */
export const ASSET_BASE = apiRoot || ''

export const assetUrl = (path) => `${ASSET_BASE}${path.startsWith('/') ? path : `/${path}`}`
