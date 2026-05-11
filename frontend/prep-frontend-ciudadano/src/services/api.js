import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:5131/api' })

export const publicApi = {
  getResults: (params) => api.get('/publicresults', { params }),
  getByEntity: () => api.get('/publicresults/by-entity'),
  getDetail: (id) => api.get(`/publicresults/${id}`)
}