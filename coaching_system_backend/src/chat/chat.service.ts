import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @Inject('FIRESTORE') private firestore: Firestore,
  ) {}

  private conversationsCollection = 'conversations';

  // Get or create conversation between coach and player
  async getOrCreateConversation(coachId: string, playerId: string, status: 'active' | 'closed' = 'active') {
    console.log('Getting/creating conversation for coach:', coachId, 'player:', playerId);

    try {
      // Check if conversation already exists
      const existingConversation = await this.firestore
        .collection(this.conversationsCollection)
        .where('coachId', '==', coachId)
        .where('playerId', '==', playerId)
        .limit(1)
        .get();

      if (!existingConversation.empty) {
        const doc = existingConversation.docs[0];
        // If conversation exists, update its status if needed
        if (status === 'active') {
          await doc.ref.update({
            status: 'active',
            updatedAt: new Date().toISOString(),
          });
        }
        return {
          id: doc.id,
          ...doc.data(),
          status: status,
        };
      }

      // Create new conversation
      const conversationData = {
        coachId,
        playerId,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: null,
      };

      const docRef = await this.firestore
        .collection(this.conversationsCollection)
        .add(conversationData);

      return {
        id: docRef.id,
        ...conversationData,
      };
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  // Close conversation between coach and player
  async closeConversation(coachId: string, playerId: string) {
    console.log('Closing conversation for coach:', coachId, 'player:', playerId);

    try {
      const existingConversation = await this.firestore
        .collection(this.conversationsCollection)
        .where('coachId', '==', coachId)
        .where('playerId', '==', playerId)
        .limit(1)
        .get();

      if (!existingConversation.empty) {
        const doc = existingConversation.docs[0];
        await doc.ref.update({
          status: 'closed',
          closedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('Conversation closed:', doc.id);
        return { success: true, conversationId: doc.id };
      }

      return { success: false, message: 'No conversation found' };
    } catch (error) {
      console.error('Error closing conversation:', error);
      throw error;
    }
  }

  // Reopen conversation between coach and player
  async reopenConversation(coachId: string, playerId: string) {
    console.log('Reopening conversation for coach:', coachId, 'player:', playerId);

    try {
      const existingConversation = await this.firestore
        .collection(this.conversationsCollection)
        .where('coachId', '==', coachId)
        .where('playerId', '==', playerId)
        .limit(1)
        .get();

      if (!existingConversation.empty) {
        const doc = existingConversation.docs[0];
        await doc.ref.update({
          status: 'active',
          closedAt: null,
          updatedAt: new Date().toISOString(),
        });
        console.log('Conversation reopened:', doc.id);
        return { success: true, conversationId: doc.id };
      }

      return { success: false, message: 'No conversation found' };
    } catch (error) {
      console.error('Error reopening conversation:', error);
      throw error;
    }
  }

  // Get all conversations for a coach with player details
  async getCoachConversations(coachId: string) {
    console.log('Fetching conversations for coach:', coachId);

    try {
      const snapshot = await this.firestore
        .collection(this.conversationsCollection)
        .where('coachId', '==', coachId)
        .orderBy('updatedAt', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      // Fetch player details for each conversation
      const conversations = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let playerName = 'Unknown Player';
          let playerEmail = '';

          try {
            const playerDoc = await this.firestore
              .collection('players')
              .doc(data.playerId)
              .get();

            if (playerDoc.exists) {
              const playerData = playerDoc.data();
              playerName = playerData?.name || 'Unknown Player';
              playerEmail = playerData?.email || '';
            }
          } catch (err) {
            console.error('Error fetching player:', err);
          }

          return {
            id: doc.id,
            ...data,
            playerName,
            playerEmail,
          };
        })
      );

      return conversations;
    } catch (error) {
      console.error('Error fetching coach conversations:', error);
      throw error;
    }
  }

  // Get all conversations for a player with coach details
  async getPlayerConversations(playerId: string) {
    console.log('Fetching conversations for player:', playerId);

    try {
      const snapshot = await this.firestore
        .collection(this.conversationsCollection)
        .where('playerId', '==', playerId)
        .orderBy('updatedAt', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      // Fetch coach details for each conversation
      const conversations = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let coachName = 'Unknown Coach';
          let coachEmail = '';

          try {
            const coachDoc = await this.firestore
              .collection('coaches')
              .doc(data.coachId)
              .get();

            if (coachDoc.exists) {
              const coachData = coachDoc.data();
              coachName = coachData?.name || 'Unknown Coach';
              coachEmail = coachData?.email || '';
            }
          } catch (err) {
            console.error('Error fetching coach:', err);
          }

          return {
            id: doc.id,
            ...data,
            coachName,
            coachEmail,
          };
        })
      );

      return conversations;
    } catch (error) {
      console.error('Error fetching player conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50) {
    console.log('Fetching messages for conversation:', conversationId, 'limit:', limit);

    try {
      const conversationDoc = await this.firestore
        .collection(this.conversationsCollection)
        .doc(conversationId)
        .get();

      if (!conversationDoc.exists) {
        throw new NotFoundException('Conversation not found');
      }

      const messagesSnapshot = await this.firestore
        .collection(this.conversationsCollection)
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const messages = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Return in chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(conversationId: string, createMessageDto: CreateMessageDto) {
    console.log('Sending message to conversation:', conversationId);

    try {
      const conversationRef = this.firestore
        .collection(this.conversationsCollection)
        .doc(conversationId);

      const conversationDoc = await conversationRef.get();

      if (!conversationDoc.exists) {
        throw new NotFoundException('Conversation not found');
      }

      const conversationData = conversationDoc.data();

      if (!conversationData) {
        throw new NotFoundException('Conversation data not available');
      }
      
      // Check subscription status before allowing messaging
      const subscription = await this.firestore
        .collection('subscriptions')
        .where('coachId', '==', conversationData.coachId)
        .where('playerId', '==', conversationData.playerId)
        .limit(1)
        .get();

      if (subscription.empty) {
        throw new BadRequestException('No subscription found between coach and player');
      }

      const subscriptionData = subscription.docs[0].data();
      
      if (subscriptionData.status !== 'active') {
        throw new BadRequestException(`Cannot send message. Subscription status is ${subscriptionData.status}. Only active subscriptions can chat.`);
      }

      const messageData: any = {
        senderId: createMessageDto.senderId,
        senderType: createMessageDto.senderType,
        text: createMessageDto.text,
        createdAt: new Date().toISOString(),
        read: false,
      };

      // Only add mediaUrl if it exists
      if (createMessageDto.mediaUrl) {
        messageData.mediaUrl = createMessageDto.mediaUrl;
      }

      // Add message to subcollection
      const messageRef = await conversationRef
        .collection('messages')
        .add(messageData);

      // Update conversation's last message and updatedAt
      await conversationRef.update({
        lastMessage: {
          text: createMessageDto.text,
          senderId: createMessageDto.senderId,
          senderType: createMessageDto.senderType,
          createdAt: messageData.createdAt,
        },
        updatedAt: messageData.createdAt,
      });

      return {
        id: messageRef.id,
        ...messageData,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId: string, userId: string, userType: 'coach' | 'player') {
    console.log('Marking messages as read for:', conversationId, userId, userType);

    try {
      const messagesRef = this.firestore
        .collection(this.conversationsCollection)
        .doc(conversationId)
        .collection('messages');

      // Get unread messages sent by the other party
      const unreadMessages = await messagesRef
        .where('read', '==', false)
        .where('senderType', '==', userType === 'coach' ? 'player' : 'coach')
        .get();

      const batch = this.firestore.batch();

      unreadMessages.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();

      return { success: true, markedCount: unreadMessages.size };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get AI chat messages for a player
  async getAiChat(playerId: string) {
    console.log('Fetching AI chat for player:', playerId);

    try {
      const messagesSnapshot = await this.firestore
        .collection('ai_chats')
        .doc(playerId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .get();

      if (messagesSnapshot.empty) {
        return [];
      }

      const messages = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return messages;
    } catch (error) {
      console.error('Error fetching AI chat:', error);
      throw error;
    }
  }

  // Send message to AI (stores both user message and AI response)
  async sendAiMessage(data: { playerId: string; message: string }) {
    console.log('Sending AI message for player:', data.playerId);

    try {
      const chatRef = this.firestore.collection('ai_chats').doc(data.playerId);

      // Store user message
      const userMessage = {
        role: 'user',
        text: data.message,
        createdAt: new Date().toISOString(),
      };

      await chatRef.collection('messages').add(userMessage);

      // Return message stored (AI response will be generated on client side)
      return {
        success: true,
        message: 'Message sent successfully',
      };
    } catch (error) {
      console.error('Error sending AI message:', error);
      throw error;
    }
  }

  // Store AI response
  async storeAiResponse(playerId: string, response: string) {
    try {
      const chatRef = this.firestore.collection('ai_chats').doc(playerId);

      const aiMessage = {
        role: 'assistant',
        text: response,
        createdAt: new Date().toISOString(),
      };

      await chatRef.collection('messages').add(aiMessage);

      return { success: true };
    } catch (error) {
      console.error('Error storing AI response:', error);
      throw error;
    }
  }

  // Delete AI chat history for a player
  async deleteAiChat(playerId: string) {
    console.log('Deleting AI chat for player:', playerId);

    try {
      const chatRef = this.firestore.collection('ai_chats').doc(playerId);
      const messagesSnapshot = await chatRef.collection('messages').get();

      const batch = this.firestore.batch();

      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return { success: true, message: 'Chat history deleted successfully' };
    } catch (error) {
      console.error('Error deleting AI chat:', error);
      throw error;
    }
  }
}
