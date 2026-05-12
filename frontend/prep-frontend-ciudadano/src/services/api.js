import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

export const publicApi = {
  getResults: (params) => api.get('/publicresults', { params }),
  getByEntity: () => api.get('/publicresults/by-entity'),
  getDetail: (id) => api.get(`/publicresults/${id}`)
}