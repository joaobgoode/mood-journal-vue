import axios from 'axios';

const baseURL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && error.response.data.code === 'token_not_valid' && !originalRequest._retry) {

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh');
        if (!refreshToken) {
          console.log("Refresh token não encontrado, deslogando.");
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          window.location.href = '/';
          return Promise.reject(error);
        }

        const response = await axios.post(`${baseURL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        console.log("Token atualizado com sucesso. Refazendo a requisição original.");

        return api(originalRequest);

      } catch (refreshError) {
        console.log("Não foi possível atualizar o token. Deslogando o usuário.", refreshError);

        localStorage.removeItem('access');
        localStorage.removeItem('refresh');

        window.location.href = '/';

        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
