'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessage } from '../../types/chat';
import { ChatMessageComponent } from './ChatMessage';
import authStore from '../../zustand/authStore';

interface MessageListProps {
  messages: ChatMessage[];
  onEdit: (messageId: number, newContent: string) => void;
  onDelete: (messageId: number) => void;
  onReply: (message: ChatMessage) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  typingUsers?: Array<{ userId: number; username: string }>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onEdit,
  onDelete,
  onReply,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  typingUsers = [],
}) => {
  const { userId: currentUserId, username: currentUsername } = authStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastMessageCountRef = useRef(messages.length);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    
    setIsNearBottom(nearBottom);
    setShouldAutoScroll(nearBottom);

    if (scrollTop === 0 && hasMore && onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isLoading]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCountRef.current;
    
    if (hasNewMessages && (shouldAutoScroll || isNearBottom)) {
      setTimeout(() => scrollToBottom(), 100);
    }
    
    lastMessageCountRef.current = messages.length;
  }, [messages.length, shouldAutoScroll, isNearBottom, scrollToBottom]);

  useEffect(() => {
    setTimeout(() => scrollToBottom(false), 100);
  }, [scrollToBottom]);

  const handleEditMessage = useCallback((messageId: number, newContent: string) => {
    onEdit(messageId, newContent);
  }, [onEdit]);

  const handleDeleteMessage = useCallback((messageId: number) => {
    if (confirm('Are you sure you want to delete this message?')) {
      onDelete(messageId);
    }
  }, [onDelete]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <div className="text-lg font-medium mb-2">No messages yet</div>
          <div className="text-sm">Be the first to start the conversation!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative min-h-0">
      {!isNearBottom && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 right-4 z-10 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Scroll to bottom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-0"
        style={{ scrollBehavior: 'smooth' }}
      >
        {hasMore && (
          <div className="p-4 text-center">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Loading messages...</span>
              </div>
            ) : (
              <button
                onClick={onLoadMore}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Load more messages
              </button>
            )}
          </div>
        )}

        <div className="space-y-1">
          {messages.map((message) => (
            <ChatMessageComponent
              key={message.message_id}
              message={message}
              isOwn={message.user.user_id === currentUserId}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReply={onReply}
            />
          ))}
        </div>

        {typingUsers.length > 0 && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0].username} is typing...`
                  : typingUsers.length === 2
                  ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};