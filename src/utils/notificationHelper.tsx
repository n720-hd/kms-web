import { 
  Bell, 
  CheckCircle, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  HelpCircle,
  MessageCircle,
  ThumbsUp
} from 'lucide-react';

// Helper function to get notification icon
export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'ANSWER_ACCEPTED':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'ANSWER_SUBMITTED':
      return <MessageSquare className="w-5 h-5 text-blue-600" />;
    case 'QUESTION_ASSIGNED':
      return <UserPlus className="w-5 h-5 text-purple-600" />;
    case 'QUESTION_COMMENTED':
      return <MessageCircle className="w-5 h-5 text-orange-600" />;
    case 'ANSWER_COMMENTED':
      return <MessageCircle className="w-5 h-5 text-orange-600" />;
    case 'LIKE':
      return <ThumbsUp className="w-5 h-5 text-pink-600" />;
    case 'FEEDBACK_ON_QUESTION':
      return <MessageSquare className="w-5 h-5 text-indigo-600" />;
    default:
      return <Bell className="w-5 h-5 text-gray-600" />;
  }
};

// Helper function to get notification background color
export const getNotificationColor = (type: string) => {
  switch (type) {
    case 'ANSWER_ACCEPTED':
      return { bg: 'bg-green-100', text: 'text-green-600' };
    case 'ANSWER_SUBMITTED':
      return { bg: 'bg-blue-100', text: 'text-blue-600' };
    case 'QUESTION_ASSIGNED':
      return { bg: 'bg-purple-100', text: 'text-purple-600' };
    case 'QUESTION_COMMENTED':
      return { bg: 'bg-orange-100', text: 'text-orange-600' };
    case 'ANSWER_COMMENTED':
      return { bg: 'bg-orange-100', text: 'text-orange-600' };
    case 'LIKE':
      return { bg: 'bg-pink-100', text: 'text-pink-600' };
    case 'FEEDBACK_ON_QUESTION':
      return { bg: 'bg-indigo-100', text: 'text-indigo-600' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600' };
  }
};

// Helper function to get notification title
export const getNotificationTitle = (type: string) => {
  switch (type) {
    case 'ANSWER_ACCEPTED':
      return 'Answer Accepted';
    case 'ANSWER_SUBMITTED':
      return 'New Answer';
    case 'QUESTION_ASSIGNED':
      return 'Question Assigned';
    case 'QUESTION_COMMENTED':
      return 'Question Comment';
    case 'ANSWER_COMMENTED':
      return 'Answer Comment';
    case 'LIKE':
      return 'Like Received';
    case 'FEEDBACK_ON_QUESTION':
      return 'Question Feedback';
    default:
      return 'Notification';
  }
};

// Enhanced time formatting function
export const formatNotificationTime = (dateString: string) => {
  const now = new Date();
  const notificationDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return notificationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};