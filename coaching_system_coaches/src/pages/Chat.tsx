import React, { useState, useEffect, useRef } from 'react';
import { MdSend, MdRefresh, MdPerson, MdAdd } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { chatService, Conversation, Message } from '../services/chat.service';
import { getPlayers, Player } from '../services/players.service';
import '../styles/chat.css';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPlayersList, setShowPlayersList] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.uid || user?.id) {
      loadConversations();
      loadPlayers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      markAsRead();
      setChatError(null); // Clear error when switching conversations
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages every 5 seconds when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const interval = setInterval(() => {
      loadMessages(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const userId = user?.uid || user?.id;
      if (!userId) return;

      const data = await chatService.getCoachConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      const userId = user?.uid || user?.id;
      if (!userId) return;

      const data = await getPlayers(userId);
      // Only show active players
      const activePlayers = data.filter(p => p.enrollmentStatus === 'active');
      setPlayers(activePlayers);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const startConversationWithPlayer = async (player: Player) => {
    try {
      const userId = user?.uid || user?.id;
      if (!userId) return;

      const conversation = await chatService.getOrCreateConversation(userId, player.id);
      
      // Reload conversations to include the new one
      await loadConversations();
      
      // Select the conversation
      setSelectedConversation({
        ...conversation,
        playerName: player.name,
        playerEmail: player.email,
      });
      
      setShowPlayersList(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation');
    }
  };

  const loadMessages = async (silent: boolean = false) => {
    if (!selectedConversation) return;

    try {
      if (!silent) setLoading(true);
      const data = await chatService.getMessages(selectedConversation.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!selectedConversation || !user) return;

    try {
      const userId = user.uid || user.id;
      if (!userId) return;
      
      await chatService.markAsRead(selectedConversation.id, userId, 'coach');
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return;

    try {
      setSending(true);
      setChatError(null);
      const userId = user.uid || user.id;
      if (!userId) return;

      await chatService.sendMessage(
        selectedConversation.id,
        userId,
        'coach',
        messageText.trim()
      );

      setMessageText('');
      await loadMessages(true);
      await loadConversations();
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle subscription status errors
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || '';
        
        if (errorMsg.includes('pending')) {
          setChatError('This subscription is pending approval. Chat will be available once approved.');
        } else if (errorMsg.includes('stopped') || errorMsg.includes('needs_review')) {
          setChatError('This subscription has ended. The student needs to renew their subscription to continue chatting.');
        } else if (errorMsg.includes('rejected')) {
          setChatError('This subscription was rejected. Chat is not available.');
        } else if (errorMsg.includes('active')) {
          setChatError('Chat is only available for active subscriptions.');
        } else {
          setChatError(errorMsg || 'Failed to send message. Please check the subscription status.');
        }
      } else {
        setChatError('Failed to send message. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="chat-container">
        <div className="loading-state">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Live Chat</h2>
          <div className="header-actions">
            <button className="new-chat-btn" onClick={() => setShowPlayersList(!showPlayersList)} title="New Chat">
              <MdAdd />
            </button>
            <button className="refresh-btn" onClick={loadConversations} title="Refresh">
              <MdRefresh />
            </button>
          </div>
        </div>

        {showPlayersList && players.length > 0 && (
          <div className="players-list">
            <div className="players-list-header">
              <span>Select a player to chat</span>
              <button onClick={() => setShowPlayersList(false)}>×</button>
            </div>
            {players.map((player) => (
              <div
                key={player.id}
                className="player-item"
                onClick={() => startConversationWithPlayer(player)}
              >
                <div className="conversation-avatar">
                  {player.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-email">{player.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="conversations-list">
          {conversations.length === 0 && !showPlayersList ? (
            <div className="no-conversations">
              <MdPerson size={48} />
              <p>No conversations yet</p>
              <span>Click the + button to start chatting with your students</span>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="conversation-avatar">
                  {conv.playerName?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">{conv.playerName || 'Unknown Player'}</div>
                  {conv.lastMessage && (
                    <div className="conversation-preview">
                      {conv.lastMessage.senderType === 'coach' ? 'You: ' : ''}
                      {conv.lastMessage.text}
                    </div>
                  )}
                </div>
                {conv.lastMessage && (
                  <div className="conversation-time">
                    {formatTime(conv.lastMessage.createdAt)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">
                  {selectedConversation.playerName?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <h3>{selectedConversation.playerName || 'Unknown Player'}</h3>
                  {selectedConversation.playerEmail && (
                    <span className="chat-email">{selectedConversation.playerEmail}</span>
                  )}
                </div>
              </div>
              <button className="refresh-btn" onClick={() => loadMessages()} title="Refresh messages">
                <MdRefresh />
              </button>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet</p>
                  <span>Start the conversation!</span>
                </div>
              ) : (
                messages.map((message, index) => {
                  const showDate =
                    index === 0 ||
                    formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="message-date-divider">
                          {formatDate(message.createdAt)}
                        </div>
                      )}
                      <div
                        className={`message ${message.senderType === 'coach' ? 'message-sent' : 'message-received'}`}
                      >
                        <div className="message-bubble">
                          <p>{message.text}</p>
                          <span className="message-time">{formatTime(message.createdAt)}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
              {chatError && (
                <div className="chat-error-banner">
                  {chatError}
                </div>
              )}
              <div>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sending}
                />
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                >
                  <MdSend />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-conversation-selected">
            <MdPerson size={64} />
            <h3>Select a conversation</h3>
            <p>Choose a student from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
