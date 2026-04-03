import axios from 'axios';

const API_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authAPI = {
  login: (username, password) => api.post('/login', { username, password })
};

export const employeeAPI = {
  addEmployee: (data) => api.post('/addEmployee', data),
  getEmployees: (page = 1, limit = 10, search = '', department = '', status = '', sortBy = 'name', sortOrder = 'asc') =>
    api.get('/employees', {
      params: { page, limit, search, department, status, sortBy, sortOrder }
    }),
  getEmployeeById: (id) => api.get(`/employees/${id}`),
  updateEmployee: (id, data) => api.put(`/updateEmployee/${id}`, data),
  deleteEmployee: (id) => api.delete(`/deleteEmployee/${id}`),
  getStatistics: () => api.get('/statistics'),
  getDepartments: () => api.get('/departments')
};

export default api;
