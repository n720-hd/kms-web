import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, SendMessageData, TypingUser } from '../types/chat';

interface UseSocketProps {
  onNewMessage?: (message: ChatMessage) => void;
  onUserTyping?: (typingUser: TypingUser) => void;
}

export const useSocket = ({ onNewMessage, onUserTyping }: UseSocketProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  const onUserTypingRef = useRef(onUserTyping);

  // Update refs when callbacks change
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onUserTypingRef.current = onUserTyping;
  }, [onNewMessage, onUserTyping]);

  const connect = useCallback(async () => {
    try {
      const socket = io('http://localhost:4700', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
        console.log('Connected to chat server');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from chat server');
      });

      socket.on('connect_error', (error) => {
        setConnectionError(`Connection failed: ${error.message}`);
        setIsConnected(false);
        console.error('Socket connection error:', error);
      });

      socket.on('new-global-message', (message: ChatMessage) => {
        onNewMessageRef.current?.(message);
      });

      socket.on('user-typing', (typingUser: TypingUser) => {
        onUserTypingRef.current?.(typingUser);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to connect to socket:', error);
      setConnectionError('Failed to establish connection');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((messageData: SendMessageData) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-global-message', messageData);
    } else {
      console.warn('Cannot send message: socket not connected');
    }
  }, [isConnected]);

  const startTyping = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing-start');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    }
  }, [isConnected]);

  const stopTyping = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing-stop');
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isConnected]);

  const debouncedTyping = useCallback(() => {
    startTyping();
  }, [startTyping]);

  useEffect(() => {
    connect();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      disconnect();
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      stopTyping();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTyping();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopTyping]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    startTyping: debouncedTyping,
    stopTyping,
    reconnect: connect,
  };
};