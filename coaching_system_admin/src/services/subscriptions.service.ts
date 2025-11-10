import axios from 'axios';

const API_URL = 'http://localhost:3000/subscriptions';

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
  async getAll(search?: string, status?: string): Promise<Subscription[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
    const response = await axios.get(url);
    return response.data;
  },

  async getById(id: string): Promise<Subscription> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  async create(data: Omit<Subscription, 'id'>): Promise<Subscription> {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  },
};
