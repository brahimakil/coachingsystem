import api from './api';

const SubscriptionModel = {
  // Check if player has subscription with coach
  checkSubscription: async (playerId, coachId) => {
    try {
      const response = await api.get(`/subscriptions/check/${playerId}/${coachId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to check subscription' };
    }
  },

  // Create new subscription
  createSubscription: async (subscriptionData) => {
    try {
      const response = await api.post('/subscriptions', subscriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create subscription' };
    }
  },

  // Get all subscriptions for a player
  getPlayerSubscriptions: async (playerId, status = null) => {
    try {
      const params = { playerId };
      if (status) params.status = status;
      
      const response = await api.get('/subscriptions', { params });
      return { success: true, data: response.data };
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subscriptions' };
    }
  },

  // Update subscription status
  updateSubscription: async (subscriptionId, updateData) => {
    try {
      const response = await api.patch(`/subscriptions/${subscriptionId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update subscription' };
    }
  },
};

export default SubscriptionModel;
