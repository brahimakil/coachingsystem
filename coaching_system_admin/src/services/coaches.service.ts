import api from './api';

export const coachesService = {
  getAll: async (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const response = await api.get(`/coaches${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/coaches/${id}`);
    return response.data;
  },

  create: async (formData: FormData) => {
    const response = await api.post('/coaches', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await api.patch(`/coaches/${id}`, data, { headers });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/coaches/${id}`);
    return response.data;
  },
};
