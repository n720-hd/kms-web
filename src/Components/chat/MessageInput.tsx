'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SendMessageData } from '../../types/chat';
import { cn } from '../../lib/utils';

interface MessageInputProps {
  onSendMessage: (messageData: SendMessageData) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  onStopTyping,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onStopTyping();
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    const messageData: SendMessageData = {
      content: trimmedMessage,
      messageType: 'text',
      replyToId: replyTo?.message_id,
    };

    onSendMessage(messageData);
    setMessage('');
    
    if (isTyping) {
      setIsTyping(false);
      onStopTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onCancelReply?.();
  };

  const handleBlur = () => {
    if (isTyping) {
      setIsTyping(false);
      onStopTyping();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t border-gray-200 bg-white">
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 mb-1">
                Replying to <span className="font-medium">@{replyTo.user.username}</span>
              </div>
              <div className="text-sm text-gray-800 truncate">{replyTo.content}</div>
            </div>
            <button
              onClick={onCancelReply}
              className="ml-3 p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Cancel reply"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="p-3 sm:p-4">
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg resize-none text-sm sm:text-base",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                "placeholder:text-gray-500"
              )}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className={cn(
              "px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors flex-shrink-0 text-sm sm:text-base",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              message.trim() && !disabled
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};