import api from './axios';

export const getMyAppointments = (params) => api.get('/appointments/me', { params });
export const createAppointment = (data) => api.post('/appointments', data);
export const confirmAppointment = (id) => api.put(`/appointments/${id}/confirm`);
export const rejectAppointment = (id) => api.put(`/appointments/${id}/reject`);
export const completeAppointment = (id) => api.put(`/appointments/${id}/complete`);
export const cancelAppointment = (id) => api.put(`/appointments/${id}/cancel`);
