import api from './api';

const PlayerModel = {
  // Get player dashboard data
  getDashboard: async (playerId) => {
    try {
      const response = await api.get(`/players/${playerId}/dashboard`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard data' };
    }
  },
};

export default PlayerModel;
