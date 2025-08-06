'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { MessageList } from '../../Components/chat/MessageList';
import { MessageInput } from '../../Components/chat/MessageInput';
import { useChatMessages, useEditMessage, useDeleteMessage, useUpdateMessagesCache } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { ChatMessage, SendMessageData, TypingUser } from '../../types/chat';
import authStore from '../../zustand/authStore';

export default function DiscussionPage() {
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const { addMessage, updateMessage, removeMessage } = useUpdateMessagesCache();

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useChatMessages(50, currentPage * 50);


  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();


  const handleNewMessage = useCallback((message: ChatMessage) => {
    addMessage(message);
  }, [addMessage]);

  const handleUserTyping = useCallback((typingUser: TypingUser) => {
    setTypingUsers(prev => {
      const filteredUsers = prev.filter(user => user.userId !== typingUser.userId);
      if (typingUser.typing) {
        return [...filteredUsers, typingUser];
      }
      return filteredUsers;
    });

    if (typingUser.typing) {
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(user => user.userId !== typingUser.userId));
      }, 5000);
    }
  }, []);

  const {
    isConnected,
    connectionError,
    sendMessage,
    startTyping,
    stopTyping,
    reconnect,
  } = useSocket({
    onNewMessage: handleNewMessage,
    onUserTyping: handleUserTyping,
  });

  const handleSendMessage = useCallback((messageData: SendMessageData) => {
    if (isConnected) {
      sendMessage(messageData);
      setReplyTo(null);
    }
  }, [isConnected, sendMessage]);

  const handleEditMessage = useCallback(async (messageId: number, newContent: string) => {
    try {
      await editMessageMutation.mutateAsync({ messageId, content: newContent });
    } catch (error) {
      console.error('Failed to edit message:', error);
      alert('Failed to edit message. Please try again.');
    }
  }, [editMessageMutation]);

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    try {
      await deleteMessageMutation.mutateAsync(messageId);
      removeMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please try again.');
    }
  }, [deleteMessageMutation, removeMessage]);

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (messagesData?.hasMore && !isLoadingMessages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [messagesData?.hasMore, isLoadingMessages]);

  const typingUsersDisplay = useMemo(() => {
    return typingUsers
      .filter(user => user.typing)
      .map(user => ({
        userId: user.userId,
        username: `User ${user.userId}`,
      }));
  }, [typingUsers]);

  if (messagesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Chat</h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the chat messages. Please try again.
          </p>
          <button
            onClick={() => refetchMessages()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Global Chat</h1>
            <div className="flex items-center gap-2 sm:gap-4 mt-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs sm:text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {messagesData && (
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
                  {messagesData.total} messages
                </span>
              )}
            </div>
          </div>
          
          {connectionError && (
            <div className="flex items-center gap-2 sm:gap-3 ml-2">
              <span className="text-xs sm:text-sm text-red-600 hidden sm:inline truncate">{connectionError}</span>
              <button
                onClick={reconnect}
                className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-red-700 transition-colors flex-shrink-0"
              >
                Reconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col h-[calc(100vh-120px)] min-h-[400px]">
        <div className="flex-1 bg-white mx-2 sm:mx-4 my-2 sm:my-4 rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden min-h-0">
          {isLoadingMessages && currentPage === 0 && !messagesData ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Loading messages...</span>
              </div>
            </div>
          ) : (
            <>
              <MessageList
                messages={messagesData?.messages || []}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onReply={handleReply}
                onLoadMore={handleLoadMore}
                hasMore={messagesData?.hasMore}
                isLoading={isLoadingMessages}
                typingUsers={typingUsersDisplay}
              />
              
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={startTyping}
                onStopTyping={stopTyping}
                replyTo={replyTo}
                onCancelReply={handleCancelReply}
                disabled={!isConnected}
                placeholder={
                  !isConnected 
                    ? "Connecting to chat..." 
                    : "Type a message..."
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}