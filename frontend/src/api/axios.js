import axios from 'axios';

/**
 * Axios instance dùng chung cho toàn bộ frontend.
 * baseURL trỏ về /api/v1 (Vite proxy sẽ forward đến localhost:3000)
 */
const api = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: tự đính token vào mỗi request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: xử lý lỗi chung
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token hết hạn hoặc không hợp lệ → xóa và về login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
