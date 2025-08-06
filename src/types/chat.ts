export interface ChatUser {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  profile_picture?: string;
}

export interface ChatReplyTo {
  message_id: number;
  content: string;
  user: ChatUser;
}

export interface ChatMessage {
  message_id: number;
  content: string;
  message_type: string;
  reply_to_id?: number;
  created_at: string;
  updated_at?: string;
  user: ChatUser;
  reply_to?: ChatReplyTo;
}

export interface SendMessageData {
  content: string;
  messageType?: string;
  replyToId?: number;
}

export interface TypingUser {
  userId: number;
  typing: boolean;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  total: number;
}

export interface SocketEvents {
  'send-global-message': SendMessageData;
  'typing-start': void;
  'typing-stop': void;
  'new-global-message': ChatMessage;
  'user-typing': TypingUser;
}