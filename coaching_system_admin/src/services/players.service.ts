import api from './api';

export const playersService = {
  getAll: async (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const response = await api.get(`/players${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/players/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/players', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/players/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/players/${id}`);
    return response.data;
  },
};
