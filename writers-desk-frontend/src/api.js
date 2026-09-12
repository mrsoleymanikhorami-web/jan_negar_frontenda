import axios from 'axios'

const api = axios.create({
  // آدرس زنده و امن بک‌اند جنگو
  baseURL: 'https://backend.jannegar.ir/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// تزریق خودکار توکن JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export default api