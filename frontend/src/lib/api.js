import axios from 'axios'
import useAuth from '../state/useAuth.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
})

api.interceptors.request.use((config)=>{
  const { token } = useAuth.getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const AuthApi = {
  async login(email,password){
    const { data } = await api.post('/api/auth/login',{ email,password })
    return data
  },
  async me(){
    const { data } = await api.get('/api/auth/me')
    return data
  }
}

export const CertApi = {
  async issue(payload){
    const { data } = await api.post('/api/cert/issue', payload)
    return data
  },
  async verifyById(certificateId){
    const { data } = await api.get(`/api/cert/verify/by-id/${certificateId}`)
    return data
  },
  async verifyQr(qrData){
    const { data } = await api.post('/api/cert/verify/qr', { qrData })
    return data
  }
}

export default api

