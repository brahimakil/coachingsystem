import api from './api';

class ChatModel {
  // Regular chat methods
  async getOrCreateConversation(coachId, playerId) {
    try {
      const response = await api.post('/chat/conversations', {
        coachId,
        playerId,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  async getPlayerConversations(playerId) {
    try {
      const response = await api.get(`/chat/conversations/player/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async getMessages(conversationId, limit = 50) {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(conversationId, senderId, senderType, text, mediaUrl = null) {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        senderId,
        senderType,
        text,
        mediaUrl,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markAsRead(conversationId, userId, userType) {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/read`, {
        userId,
        userType,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  // AI Chat methods
  async getAiChat(playerId) {
    try {
      const response = await api.get(`/chat/ai/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI chat:', error);
      throw error;
    }
  }

  async sendAiMessage(playerId, message) {
    try {
      const response = await api.post('/chat/ai', {
        playerId,
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending AI message:', error);
      throw error;
    }
  }

  async storeAiResponse(playerId, response) {
    try {
      const result = await api.post('/chat/ai/response', {
        playerId,
        response,
      });
      return result.data;
    } catch (error) {
      console.error('Error storing AI response:', error);
      throw error;
    }
  }

  async deleteAiChat(playerId) {
    try {
      const response = await api.delete(`/chat/ai/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting AI chat:', error);
      throw error;
    }
  }
}

export default new ChatModel();
