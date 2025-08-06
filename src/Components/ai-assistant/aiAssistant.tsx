import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Bot, User, Loader2, MessageSquare, Plus, Trash2, Wifi, WifiOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { io, Socket } from 'socket.io-client';
import instance from '@/utils/axiosInstance';
import { toast } from 'react-toastify';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  tokens?: number;
  isStreaming?: boolean;
  isTemporary?: boolean;
}

interface Conversation {
  id?: number;
  conversation_id?: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
  last_activity?: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
}

const ChatAI: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('deepseek/deepseek-r1-0528:free');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isNewConversation, setIsNewConversation] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [temporaryMessages, setTemporaryMessages] = useState<ChatMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const availableModels: AIModel[] = [
    { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 (Free)', description: 'Latest reasoning model' },
    { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen 3 (Free)', description: 'Compact and efficient' },
  ];

  // Initialize WebSocket connection
  useEffect(() => {
    const socketInstance = io('http://localhost:4700', {
      transports: ['websocket'],
      withCredentials: true
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Listen for AI streaming chunks
    socketInstance.on('ai-chunk', (data: { content: string }) => {
      console.log('Received AI chunk:', data.content);
      setStreamingMessage(prev => prev + data.content);
    });

    // Listen for AI completion
    socketInstance.on('ai-complete', (data: any) => {
      console.log('AI streaming complete:', data);
      setIsStreaming(false);
      setStreamingMessage('');
      setStreamingMessageId(null);
      
      // Clear temporary messages as they'll be in the refreshed data
      setTemporaryMessages([]);
      
      // Refresh conversation data
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      if (data.conversationId) {
        setCurrentConversationId(data.conversationId);
        setIsNewConversation(false);
        queryClient.invalidateQueries({ 
          queryKey: ['ai-conversation-details', data.conversationId] 
        });
      }
      
      toast.success('Message sent successfully!');
    });

    // Listen for AI errors
    socketInstance.on('ai-error', (data: { error: string }) => {
      console.error('AI streaming error:', data.error);
      setIsStreaming(false);
      setStreamingMessage('');
      setStreamingMessageId(null);
      toast.error('AI Error: ' + data.error);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient]);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversationId, streamingMessage, temporaryMessages]);

  // Fetch conversation list
  const { data: conversationList, isLoading: conversationsLoading } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      const res = await instance.get('/ai/chats');
      return res.data.data || [];
    },
    refetchOnWindowFocus: false,
  });

  // Fetch conversation details (messages)
  const { data: conversationDetails, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['ai-conversation-details', currentConversationId],
    queryFn: async (): Promise<{ conversation: any; messages: ChatMessage[] }> => {
      if (!currentConversationId) return { conversation: null, messages: [] };
      
      try {
        const res = await instance.get(`/ai/chat/${currentConversationId}`);
        const apiData = res.data.data;
        
        // Extract conversation info
        const conversation = {
          id: apiData.conversation_id,
          title: apiData.title,
          created_at: apiData.created_at,
          updated_at: apiData.updated_at
        };
        
        // Extract and format messages from ConversationMessage array
        const rawMessages = apiData.ConversationMessage || [];
        const formattedMessages: ChatMessage[] = [];
        
        rawMessages.forEach((msg: any) => {
          // Add user message
          formattedMessages.push({
            id: `user_${msg.message_id}`,
            type: 'user',
            content: msg.prompt,
            timestamp: msg.created_at
          });
          
          // Add AI response if it exists
          if (msg.response) {
            formattedMessages.push({
              id: `assistant_${msg.message_id}`,
              type: 'assistant',
              content: msg.response,
              timestamp: msg.created_at,
              model: msg.ai_model,
              tokens: msg.tokens_used
            });
          }
        });
        
        return {
          conversation,
          messages: formattedMessages
        };
        
      } catch (error) {
        console.error('Error fetching conversation details:', error);
        throw error;
      }
    },
    enabled: !!currentConversationId,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Send message via WebSocket
  const handleSendMessage = () => {
    if (!inputMessage.trim() || isStreaming || !socket || !isConnected) return;

    const userMessage = inputMessage.trim();
    
    // Add user message to temporary messages immediately
    const tempUserMessage: ChatMessage = {
      id: `temp_user_${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      isTemporary: true
    };
    
    setTemporaryMessages(prev => [...prev, tempUserMessage]);

    // Create streaming message ID
    const messageId = `streaming_${Date.now()}`;
    setStreamingMessageId(messageId);
    setIsStreaming(true);
    setStreamingMessage('');

    // Emit message to WebSocket server - using 'ai-chat' event name
    socket.emit('ai-chat', {
      prompt: userMessage,
      aiModel: selectedModel,
      conversationId: isNewConversation ? null : currentConversationId,
      socketId: socket.id
    });

    setInputMessage('');
  };

  // Delete conversation mutation
  const { mutate: deleteConversation } = useMutation({
    mutationFn: async (conversationId: number) => {
      await instance.patch(`/ai/chat/${conversationId}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      setCurrentConversationId(null);
      setIsNewConversation(false);
      setTemporaryMessages([]);
      toast.success('Conversation deleted');
    },
    onError: () => {
      toast.error('Failed to delete conversation');
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setIsNewConversation(true);
    setInputMessage('');
    setStreamingMessage('');
    setIsStreaming(false);
    setTemporaryMessages([]);
  };

  const handleSelectConversation = (conversationId: number) => {
    setCurrentConversationId(conversationId);
    setIsNewConversation(false);
    setStreamingMessage('');
    setIsStreaming(false);
    setTemporaryMessages([]);
  };

  const handleDeleteConversation = (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversationId);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatTimestamp(timestamp);
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Combine stored messages with temporary messages
  const allMessages = [
    ...(conversationDetails?.messages || []),
    ...temporaryMessages
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Conversation
          </button>
          
          {/* Connection Status */}
          <div className={`mt-2 flex items-center gap-2 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Model Selection */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Model:
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="animate-spin mx-auto mb-2" size={20} />
              <p className="text-sm text-gray-500">Loading conversations...</p>
            </div>
          ) : conversationList && conversationList.length > 0 ? (
            <div className="space-y-1 p-2">
              {conversationList.map((conversation) => {
                const conversationId = conversation.id || conversation.conversation_id;
                return (
                  <div
                    key={conversationId}
                    onClick={() => conversationId && handleSelectConversation(conversationId)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      currentConversationId === conversationId
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.title || 'Untitled Conversation'}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(conversation.last_activity || conversation.updated_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => conversationId && handleDeleteConversation(conversationId, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="mx-auto mb-2" size={32} />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start a new conversation to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversationId || isNewConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isNewConversation 
                      ? 'New Conversation' 
                      : (conversationDetails?.conversation?.title || 'Chat')
                    }
                  </h2>
                  <p className="text-sm text-gray-500">
                    Model: {selectedModel.split('/')[1]?.replace('-', ' ') || selectedModel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {isNewConversation 
                      ? 'Ready to chat' 
                      : `${allMessages.length} messages`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isNewConversation && allMessages.length === 0 && !isStreaming ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare size={48} className="mb-4" />
                  <p className="text-lg font-medium">Ready to start a new conversation</p>
                  <p className="text-sm">Type your message below to begin chatting with AI</p>
                </div>
              ) : messagesLoading && !isNewConversation ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : messagesError && !isNewConversation ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center text-red-500">
                    <p className="mb-2">Error loading messages:</p>
                    <p className="text-sm">{messagesError.message}</p>
                    <button 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['ai-conversation-details', currentConversationId] })}
                      className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Regular Messages */}
                  {allMessages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex gap-3 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                          <Bot size={16} />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="text-sm">
                          {message.type === 'assistant' ? (
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          ) : (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          )}
                        </div>
                        <div className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                          {message.model && (
                            <span className="ml-2">• {message.model}</span>
                          )}
                          {message.tokens && (
                            <span className="ml-2">• {message.tokens} tokens</span>
                          )}
                        </div>
                      </div>

                      {message.type === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white flex-shrink-0">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Streaming Message */}
                  {isStreaming && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                        <Bot size={16} />
                      </div>
                      <div className="max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg bg-white border border-gray-200">
                        <div className="text-sm">
                          {streamingMessage ? (
                            <ReactMarkdown>
                              {streamingMessage}
                            </ReactMarkdown>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Loader2 size={16} className="animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs mt-2 text-gray-500 flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" />
                          Streaming...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty State - only show if no messages at all */}
                  {allMessages.length === 0 && !isStreaming && !isNewConversation && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MessageSquare size={48} className="mb-4" />
                      <p>No messages in this conversation</p>
                      <p className="text-sm">Send a message to get started</p>
                    </div>
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isNewConversation ? "Start your conversation..." : "Type your message..."}
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                  rows={1}
                  disabled={isStreaming || !isConnected}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isStreaming || !isConnected}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isStreaming ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Bot size={64} className="mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to AI Chat</h2>
              <p className="text-gray-600 mb-6 max-w-md">
                Start a new conversation or select an existing one from the sidebar to begin chatting with AI.
              </p>
              <button
                onClick={handleNewConversation}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={20} />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatAI;