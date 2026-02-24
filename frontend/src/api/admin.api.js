import api from './axios';

export const getAllUsers = (params) => api.get('/admin/users', { params });
export const toggleUserLock = (id, isLocked) => api.put(`/admin/users/${id}/lock`, { isLocked });
export const getStats = () => api.get('/admin/stats');
