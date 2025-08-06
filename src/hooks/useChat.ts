import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axiosInstance';
import { ChatMessage, MessagesResponse, SendMessageData } from '../types/chat';

const CHAT_QUERY_KEY = 'chat-messages';

export const useChatMessages = (limit: number = 50, offset: number = 0) => {
  return useQuery<MessagesResponse>({
    queryKey: [CHAT_QUERY_KEY, limit, offset],
    queryFn: async () => {
      try {
        const response = await axios.get(`/chat/messages?limit=${limit}&offset=${offset}`);
        
        // Handle the nested response structure
        const responseData = response.data;
        if (!responseData || typeof responseData !== 'object') {
          throw new Error('Invalid response format');
        }
        
        // Extract the actual data from the nested structure
        const data = responseData.data || responseData;
        
        return {
          messages: Array.isArray(data.messages) ? data.messages : [],
          hasMore: Boolean(data.hasMore),
          total: Number(data.totalCount || data.total) || 0,
        };
      } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number; content: string }) => {
      const response = await axios.put(`/chat/messages/${messageId}`, { content });
      return response.data;
    },
    onSuccess: (updatedMessage: ChatMessage) => {
      queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      await axios.delete(`/chat/messages/${messageId}`);
      return messageId;
    },
    onSuccess: (deletedMessageId: number) => {
      queryClient.setQueryData([CHAT_QUERY_KEY, 50, 0], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          messages: oldData.messages.filter((msg: ChatMessage) => msg.message_id !== deletedMessageId),
        };
      });
    },
  });
};

export const useUpdateMessagesCache = () => {
  const queryClient = useQueryClient();
  
  const addMessage = (newMessage: ChatMessage) => {
    queryClient.setQueryData([CHAT_QUERY_KEY, 50, 0], (oldData: any) => {
      if (!oldData) return { messages: [newMessage], hasMore: false, total: 1 };
      
      // Handle case where messages might not be an array
      const existingMessages = Array.isArray(oldData.messages) ? oldData.messages : [];
      
      return {
        ...oldData,
        messages: [...existingMessages, newMessage],
        total: (oldData.total || 0) + 1,
      };
    });
  };
  
  const updateMessage = (updatedMessage: ChatMessage) => {
    queryClient.setQueryData([CHAT_QUERY_KEY, 50, 0], (oldData: any) => {
      if (!oldData) return oldData;
      
      const existingMessages = Array.isArray(oldData.messages) ? oldData.messages : [];
      
      return {
        ...oldData,
        messages: existingMessages.map((msg: ChatMessage) =>
          msg.message_id === updatedMessage.message_id ? updatedMessage : msg
        ),
      };
    });
  };
  
  const removeMessage = (messageId: number) => {
    queryClient.setQueryData([CHAT_QUERY_KEY, 50, 0], (oldData: any) => {
      if (!oldData) return oldData;
      
      const existingMessages = Array.isArray(oldData.messages) ? oldData.messages : [];
      
      return {
        ...oldData,
        messages: existingMessages.filter((msg: ChatMessage) => msg.message_id !== messageId),
        total: Math.max(0, (oldData.total || existingMessages.length) - 1),
      };
    });
  };
  
  return { addMessage, updateMessage, removeMessage };
};