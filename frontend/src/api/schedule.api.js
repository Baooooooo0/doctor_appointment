import api from './axios';

export const getSchedules = (params) => api.get('/schedules', { params });
export const getMySchedules = (params) => api.get('/schedules/me', { params });
export const createSchedule = (data) => api.post('/schedules', data);
export const createBulkSchedule = (slots) => api.post('/schedules/bulk', { slots });
export const cancelSchedule = (id) => api.put(`/schedules/${id}/cancel`);
