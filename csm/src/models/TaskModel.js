import api from './api';

const TaskModel = {
  // Get all tasks for a player
  getPlayerTasks: async (playerId, status = null) => {
    try {
      const params = { playerId };
      if (status) params.status = status;
      
      const response = await api.get('/tasks', { params });
      return { success: true, data: response.data };
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch tasks' };
    }
  },

  // Get single task details
  getTask: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch task details' };
    }
  },

  // Submit task with media and text
  submitTask: async (taskId, textResponse, mediaFiles) => {
    try {
      const formData = new FormData();
      
      if (textResponse) {
        formData.append('textResponse', textResponse);
      }

      if (mediaFiles && mediaFiles.length > 0) {
        mediaFiles.forEach((file) => {
          formData.append('media', {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.name || `media_${Date.now()}.jpg`,
          });
        });
      }

      const response = await api.post(`/tasks/${taskId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit task' };
    }
  },
};

export default TaskModel;
