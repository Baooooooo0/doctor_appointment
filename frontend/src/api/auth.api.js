import api from './axios';

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const refresh = (refreshToken) => api.post('/auth/refresh', { refreshToken });
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });
