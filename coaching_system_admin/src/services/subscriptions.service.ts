import api from './api';

interface Subscription {
  id: string;
  playerId: string;
  coachId: string;
  status: 'active' | 'pending' | 'rejected' | 'stopped';
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export const subscriptionsService = {
  async getAll(search?: string, status?: string, coachId?: string, playerId?: string): Promise<Subscription[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (coachId) params.append('coachId', coachId);
    if (playerId) params.append('playerId', playerId);
    
    const url = params.toString() ? `/subscriptions?${params.toString()}` : '/subscriptions';
    const response = await api.get(url);
    return response.data;
  },

  async getById(id: string): Promise<Subscription> {
    const response = await api.get(`/subscriptions/${id}`);
    return response.data;
  },

  async create(data: Omit<Subscription, 'id'>): Promise<Subscription> {
    const response = await api.post('/subscriptions', data);
    return response.data;
  },

  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    const response = await api.patch(`/subscriptions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/subscriptions/${id}`);
  },
};
