import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendAiMessageDto } from './dto/send-ai-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Get or create conversation
  @Post('conversations')
  async getOrCreateConversation(@Body() createConversationDto: CreateConversationDto) {
    return this.chatService.getOrCreateConversation(
      createConversationDto.coachId,
      createConversationDto.playerId,
    );
  }

  // Get all conversations for a coach
  @Get('conversations/coach/:coachId')
  async getCoachConversations(@Param('coachId') coachId: string) {
    return this.chatService.getCoachConversations(coachId);
  }

  // Get all conversations for a player
  @Get('conversations/player/:playerId')
  async getPlayerConversations(@Param('playerId') playerId: string) {
    return this.chatService.getPlayerConversations(playerId);
  }

  // Get messages for a conversation
  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
  ) {
    const messageLimit = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getMessages(conversationId, messageLimit);
  }

  // Send a message
  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, createMessageDto);
  }

  // Mark messages as read
  @Post('conversations/:conversationId/read')
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @Body() body: { userId: string; userType: 'coach' | 'player' },
  ) {
    return this.chatService.markAsRead(conversationId, body.userId, body.userType);
  }

  // AI Chat endpoints
  @Get('ai/:playerId')
  async getAiChat(@Param('playerId') playerId: string) {
    return this.chatService.getAiChat(playerId);
  }

  @Post('ai')
  async sendAiMessage(@Body() sendAiMessageDto: SendAiMessageDto) {
    return this.chatService.sendAiMessage(sendAiMessageDto);
  }

  @Post('ai/response')
  async storeAiResponse(
    @Body() body: { playerId: string; response: string },
  ) {
    return this.chatService.storeAiResponse(body.playerId, body.response);
  }

  @Delete('ai/:playerId')
  async deleteAiChat(@Param('playerId') playerId: string) {
    return this.chatService.deleteAiChat(playerId);
  }
}
