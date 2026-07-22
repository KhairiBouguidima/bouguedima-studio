import axios from 'axios'
import { API } from '../config'

export const TOKEN_KEY = 'studio_token'

export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || ''
export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY)

const apiClient = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const apiErrorMessage = (error, fallback = 'Request failed') =>
  error.response?.data?.detail || error.message || fallback

export default apiClient
