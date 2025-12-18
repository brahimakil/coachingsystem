import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface Message {
  id: string;
  senderId: string;
  senderType: 'coach' | 'player';
  text: string;
  mediaUrl?: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  coachId: string;
  playerId: string;
  playerName?: string;
  playerEmail?: string;
  coachName?: string;
  coachEmail?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    text: string;
    senderId: string;
    senderType: string;
    createdAt: string;
  };
}

class ChatService {
  // Get or create conversation
  async getOrCreateConversation(coachId: string, playerId: string): Promise<Conversation> {
    const response = await axios.post(`${API_BASE_URL}/chat/conversations`, {
      coachId,
      playerId,
    });
    return response.data;
  }

  // Get all conversations for a coach
  async getCoachConversations(coachId: string): Promise<Conversation[]> {
    const response = await axios.get(`${API_BASE_URL}/chat/conversations/coach/${coachId}`);
    return response.data;
  }

  // Get all conversations for a player
  async getPlayerConversations(playerId: string): Promise<Conversation[]> {
    const response = await axios.get(`${API_BASE_URL}/chat/conversations/player/${playerId}`);
    return response.data;
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const response = await axios.get(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
      { params: { limit } }
    );
    return response.data;
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'coach' | 'player',
    text: string,
    mediaUrl?: string
  ): Promise<Message> {
    const response = await axios.post(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
      {
        senderId,
        senderType,
        text,
        mediaUrl,
      }
    );
    return response.data;
  }

  // Mark messages as read
  async markAsRead(
    conversationId: string,
    userId: string,
    userType: 'coach' | 'player'
  ): Promise<{ success: boolean; markedCount: number }> {
    const response = await axios.post(
      `${API_BASE_URL}/chat/conversations/${conversationId}/read`,
      {
        userId,
        userType,
      }
    );
    return response.data;
  }
}

export const chatService = new ChatService();
