'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { cn } from '../../lib/utils';
import authStore from '../../zustand/authStore';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwn: boolean;
  onEdit?: (messageId: number, newContent: string) => void;
  onDelete?: (messageId: number) => void;
  onReply?: (message: ChatMessageType) => void;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  onEdit,
  onDelete,
  onReply,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await onEdit?.(message.message_id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  useEffect(() => {
    if (showMenu) {
      const handleClick = () => setShowMenu(false);
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showMenu]);

  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

  return (
    <div
      className={cn(
        'flex gap-2 sm:gap-3 px-3 sm:px-4 py-2 hover:bg-gray-50 transition-colors',
        isOwn && 'bg-blue-50/50'
      )}
    >
      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
        <AvatarImage src={message.user.profile_picture} alt={message.user.username} />
        <AvatarFallback className="bg-blue-500 text-white text-xs sm:text-sm">
          {getInitials(message.user.first_name, message.user.last_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-xs sm:text-sm">
              {message.user.first_name} {message.user.last_name}
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">@{message.user.username}</span>
            <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>
            {message.updated_at && message.updated_at !== message.created_at && (
              <span className="text-xs text-gray-400 italic">(edited)</span>
            )}
          </div>
          
          {!isEditing && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                  {isOwn ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete?.(message.message_id);
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onReply?.(message);
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {message.reply_to && (
          <div className="mb-2 p-2 bg-gray-100 border-l-4 border-gray-300 rounded text-sm">
            <div className="text-gray-600 mb-1">
              Replying to <span className="font-medium">@{message.reply_to.user.username}</span>
            </div>
            <div className="text-gray-800 truncate">{message.reply_to.content}</div>
          </div>
        )}

        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={Math.min(Math.max(editContent.split('\n').length, 1), 10)}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-800 text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}

      </div>
    </div>
  );
};