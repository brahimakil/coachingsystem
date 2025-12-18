import api from './api';

const CoachModel = {
  // Get filter options
  getFilterOptions: async () => {
    try {
      const response = await api.get('/coaches/filters/options');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch filter options' };
    }
  },

  // Get all coaches with filters
  getCoaches: async (filters = {}) => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.profession) params.profession = filters.profession;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.status) params.status = filters.status;
      if (filters.day) params.day = filters.day;
      
      const response = await api.get('/coaches', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch coaches' };
    }
  },

  // Get single coach details
  getCoach: async (coachId) => {
    try {
      const response = await api.get(`/coaches/${coachId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch coach details' };
    }
  },
};

export default CoachModel;
