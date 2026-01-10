import api from './api';

const RatingModel = {
  // Create a new rating
  createRating: async (ratingData) => {
    try {
      const response = await api.post('/ratings', ratingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit rating' };
    }
  },

  // Get ratings for a coach
  getCoachRatings: async (coachId) => {
    try {
      const response = await api.get(`/ratings?coachId=${coachId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch ratings' };
    }
  },

  // Get rating stats for a coach
  getCoachRatingStats: async (coachId) => {
    try {
      const response = await api.get(`/ratings/coach/${coachId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch rating stats' };
    }
  },

  // Get player's rating for a specific coach
  getPlayerRatingForCoach: async (coachId, playerId) => {
    try {
      const response = await api.get(`/ratings/coach/${coachId}/player/${playerId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error.response?.data || { message: 'Failed to fetch rating' };
    }
  },

  // Update a rating
  updateRating: async (ratingId, ratingData) => {
    try {
      const response = await api.patch(`/ratings/${ratingId}`, ratingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update rating' };
    }
  },

  // Delete a rating
  deleteRating: async (ratingId) => {
    try {
      const response = await api.delete(`/ratings/${ratingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete rating' };
    }
  },

  // Get all ratings by a player
  getPlayerRatings: async (playerId) => {
    try {
      const response = await api.get(`/ratings?playerId=${playerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch your ratings' };
    }
  },
};

export default RatingModel;
