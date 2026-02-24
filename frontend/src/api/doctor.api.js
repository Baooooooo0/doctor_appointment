import api from './axios';

export const getDoctors = (params) => api.get('/doctors', { params });
export const searchDoctors = (params) => api.get('/doctors/search', { params });
export const getDoctorMe = () => api.get('/doctors/me');
export const updateDoctorMe = (data) => api.put('/doctors/me', data);
export const getAvailableDoctors = (date) => api.get('/doctors/available', { params: { date } });
