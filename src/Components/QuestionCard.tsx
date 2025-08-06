'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ThumbsUp, 
  MessageCircle, 
  CheckCircle, 
  Star, 
  Bookmark 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import instance from '@/utils/axiosInstance';

interface Creator {
  username: string;
  email: string;
  profile_picture?: string;
}

interface Tag {
  id?: string;
  tag_id?: number;
  name: string;
}

interface Question {
  id: number;
  question_id?: number;
  title: string;
  content: string;
  status?: string;
  created_at: string;
  creator?: Creator;
  tags: Tag[];
  likes_count: number;
  comments_count?: number;
  answers_count: number;
  has_accepted_answer?: boolean;
  average_rating?: number;
}

interface QuestionCardProps {
  question: Question;
  onTagClick?: (tagName: string) => void;
  showSaveButton?: boolean;
  compact?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onTagClick, 
  showSaveButton = false,
  compact = false 
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Save question mutation
  const saveQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return await instance.post('/question/save', { question_id: questionId });
    },
    onSuccess: () => {
      toast.success("Question saved successfully");
      queryClient.invalidateQueries({ queryKey: ['saved-questions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save question");
    }
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-blue-100 text-blue-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveQuestion = () => {
    const questionId = question.id || question.question_id;
    if (questionId) {
      saveQuestionMutation.mutate(questionId);
    }
  };

  const questionId = question.id || question.question_id;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {/* Status and Answered indicators */}
          {!compact && (
            <div className="flex items-center space-x-2 mb-2">
              {question.status && (
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                    question.status
                  )}`}
                >
                  {question.status}
                </span>
              )}
              {question.has_accepted_answer && (
                <span className="flex items-center text-green-600 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Answered
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h2
            className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer`}
            onClick={() => router.push(`/questions/${questionId}`)}
          >
            {question.title}
          </h2>

          {/* Content */}
          <p className={`text-gray-600 text-sm mb-4 ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {question.content.length > 200
              ? `${question.content.substring(0, 200)}...`
              : question.content}
          </p>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map((tag) => (
                <button
                  key={tag.id || tag.tag_id || tag.name}
                  onClick={() => onTagClick?.(tag.name)}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Creator info for compact mode */}
          {compact && question.creator && (
            <div className="flex items-center text-sm text-gray-500">
              <span>
                asked {new Date(question.created_at).toLocaleDateString()} by
              </span>
              <span className="ml-1 text-blue-600">
                {question.creator.username}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end space-y-2 ml-6">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1" />
              {question.likes_count}
            </div>
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" />
              {question.answers_count}
            </div>
            {!compact && question.comments_count !== undefined && (
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                {question.comments_count}
              </div>
            )}
            {question.average_rating !== undefined && (
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                {question.average_rating ? question.average_rating.toFixed(1) : '0.0'}
              </div>
            )}
            {showSaveButton && (
              <button
                onClick={handleSaveQuestion}
                disabled={saveQuestionMutation.isPending}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 disabled:opacity-50 transition-colors"
                title="Save this question"
              >
                <Bookmark
                  size={16}
                  className={
                    saveQuestionMutation.isPending
                      ? "animate-pulse"
                      : ""
                  }
                />
                <span className="text-sm">Save</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer with creator info for full mode */}
      {!compact && question.creator && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span>
                Asked by <strong>{question.creator.username}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <span>{new Date(question.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;