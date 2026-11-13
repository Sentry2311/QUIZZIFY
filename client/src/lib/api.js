import axios from 'axios';

export const TOKEN_KEY = 'quizzify_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the API running?' : error.message);
    const details = error.response?.data?.details;

    if (status === 401) window.dispatchEvent(new Event('quizzify:unauthorized'));

    return Promise.reject(Object.assign(new Error(message), { status, details }));
  },
);

export default api;

/* ---- endpoint helpers (keeps page components free of URL strings) ---- */
export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (payload) => api.patch('/auth/profile', payload),
};

export const quizApi = {
  list: (params) => api.get('/quizzes', { params }),
  categories: () => api.get('/quizzes/categories'),
  get: (id) => api.get(`/quizzes/${id}`),
  mine: () => api.get('/quizzes/mine'),
  create: (payload) => api.post('/quizzes', payload),
  update: (id, payload) => api.put(`/quizzes/${id}`, payload),
  remove: (id) => api.delete(`/quizzes/${id}`),
  leaderboard: (id) => api.get(`/quizzes/${id}/leaderboard`),
  submitAttempt: (id, payload) => api.post(`/quizzes/${id}/attempts`, payload),
};

export const attemptApi = {
  mine: () => api.get('/attempts/mine'),
  leaderboard: () => api.get('/leaderboard'),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
