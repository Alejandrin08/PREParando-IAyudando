import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:5131/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

export const actasApi = {
  uploadBatch: (formData) =>
    api.post('/actas/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getQueue: (params) => api.get('/actas/queue', { params }),
  getActa: (id) => api.get(`/actas/${id}`),
  getDashboard: () => api.get('/actas/dashboard'),
  approveActa: (id, approvedBy) => api.put(`/actas/${id}/approve`, { approvedBy }),
  correctField: (id, data) => api.put(`/actas/${id}/correct`, data),
  rejectActa: (id, approvedBy) => api.put(`/actas/${id}/reject`, { approvedBy }),
}