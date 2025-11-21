import api from './api';

export interface Task {
  id: string;
  coachId: string;
  playerId: string;
  subscriptionId: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  startDate: string;
  dueDate: string;
  submission?: {
    videos?: string[];
    notes?: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
  };
  playerName?: string;
  coachName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoachPlayer {
  id: string;
  name: string;
  email: string;
}

export const tasksService = {
  async getAll(coachId?: string, playerId?: string, status?: string): Promise<Task[]> {
    const params = new URLSearchParams();
    if (coachId) params.append('coachId', coachId);
    if (playerId) params.append('playerId', playerId);
    if (status) params.append('status', status);

    const url = params.toString() ? `/tasks?${params.toString()}` : '/tasks';
    const response = await api.get(url);
    return response.data;
  },

  async getById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async create(data: Omit<Task, 'id'>): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async getCoachPlayers(coachId: string): Promise<CoachPlayer[]> {
    const response = await api.get(`/tasks/coach/${coachId}/players`);
    return response.data;
  },
};
