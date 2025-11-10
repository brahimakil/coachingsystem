import api from './api';

export interface DashboardStats {
  totals: {
    players: number;
    coaches: number;
    subscriptions: number;
  };
  active: {
    players: number;
    coaches: number;
    subscriptions: number;
  };
  subscriptionsByStatus: {
    active: number;
    pending: number;
    rejected: number;
    stopped: number;
  };
  monthlyData: Array<{
    month: string;
    players: number;
    coaches: number;
    subscriptions: number;
  }>;
}

export const dashboardService = {
  async getStatistics(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};
