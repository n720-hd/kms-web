"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import instance from "@/utils/axiosInstance";
import authStore from "@/zustand/authStore";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, MessageSquare, Send, X, Paperclip, Download, Eye, ChevronLeft, ChevronRight, Bookmark, Star } from "lucide-react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

interface User {
  user_id: number;
  username: string;
  division?: {
    division_name: string;
  };
}

interface Comment {
  comment_id: number;
  content: string;
  created_at: string;
  user: User;
  replies: Comment[];
  attachment: Attachment[];
}

interface Attachment {
  attachment_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
}

interface Tag {
  tag_id: number;
  tag_name: string;
}

interface Answer {
  answer_id: number;
  content: string;
  created_at: string;
  user: User;
  likes_count?: number;
  is_liked?: boolean;
  attachment?: Attachment[];
  is_accepted?: boolean;
}

interface QuestionDetails {
  question_id: number;
  title: string;
  content: string;
  created_at: string;
  creator: User;
  collaborator: User[];
  collaborator_type: string;
  attachment: Attachment[];
  answers: Answer[];
  comments: Comment[];
  tags: Tag[];
  like_count: { likes: number };
  is_liked?: boolean;
  total_answer: number;
  total_attachments: number;
  average_rating: number;
  status: string;
}

// Validation schemas
const commentSchema = Yup.object().shape({
  content: Yup.string().required('Comment is required').min(1, 'Comment cannot be empty'),
  files: Yup.array()
});

const answerSchema = Yup.object().shape({
  content: Yup.string().required('Answer is required').min(1, 'Answer cannot be empty'),
  files: Yup.array()
});

const feedbackSchema = Yup.object().shape({
  content: Yup.string().required('Feedback message is required').min(5, 'Please provide more detailed feedback'),
  rating: Yup.number().required('Please select a rating').min(1, 'Please select a rating from 1 to 5 stars').max(5)
});

// Star Rating Component - moved outside to prevent re-creation
const StarRating: React.FC<{ rating: number; setRating: (rating: number) => void; disabled?: boolean }> = ({ 
  rating, 
  setRating, 
  disabled = false 
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleStarHover = (starValue: number) => {
    if (!disabled) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="flex space-x-1" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            className={`p-1 transition-all duration-150 ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              size={24}
              className={`transition-all duration-150 ${
                isActive
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

// Feedback Modal Component - moved outside to prevent re-creation
const FeedbackModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; rating: number; question_id: number }) => void;
  isSubmitting: boolean;
  questionId: number;
}> = ({ isOpen, onClose, onSubmit, isSubmitting, questionId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Share Your Feedback</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          How was your experience reading this question? Your feedback helps us improve the platform.
        </p>

        <Formik
          initialValues={{ content: '', rating: 0 }}
          validationSchema={feedbackSchema}
          onSubmit={(values) => {
            onSubmit({
              content: values.content,
              rating: values.rating,
              question_id: questionId
            });
          }}
        >
          {({ values, errors, touched, setFieldValue, setFieldTouched }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex items-center space-x-2">
                  <StarRating 
                    rating={values.rating} 
                    setRating={(rating) => {
                      setFieldValue('rating', rating);
                      setFieldTouched('rating', true);
                    }}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-500">
                    {values.rating > 0 ? `(${values.rating}/5)` : '(0/5)'}
                  </span>
                </div>
                {errors.rating && touched.rating && (
                  <div className="text-red-500 text-xs mt-1">{errors.rating}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Message *
                </label>
                <Field
                  as="textarea"
                  name="content"
                  placeholder="Tell us about your experience..."
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={4}
                />
                {errors.content && touched.content && (
                  <div className="text-red-500 text-xs mt-1">{errors.content}</div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || values.rating === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    "Submit Feedback"
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

const QuestionDetailsPage: React.FC = () => {
  const { question_id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasShownFeedback, setHasShownFeedback] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { role, username } = authStore();

  // Fetch question details using useQuery
  const { data: question, isLoading: loading, error } = useQuery({
    queryKey: ['question', question_id],
    queryFn: async () => {
      const response = await instance.get(`/question/details/${question_id}`);
      if (response.data.error) {
        throw new Error(response.data.message || "Question not found");
      }
      return response.data.data as QuestionDetails;
    },
    retry: 1
  });

  console.log("Question data:", question);

  const {data: likeStatus} = useQuery({
    queryKey: ['question-like-status', question_id],
    queryFn: async () => {
      const response = await instance.get(`/question/${question_id}/like/status`)
      return response.data.data
    },
    retryOnMount: true
  })

  // Reading time and scroll tracking
  useEffect(() => {
    // Start timer when component mounts
    timerRef.current = setInterval(() => {
      setReadingTime(prev => prev + 1);
    }, 1000);

    // Handle scroll tracking
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if user has scrolled to near bottom (90% of the page)
      if (scrollTop + windowHeight >= documentHeight * 0.9) {
        setHasScrolledToBottom(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Show feedback modal when conditions are met
  useEffect(() => {
    if (!hasShownFeedback && readingTime >= 30 && hasScrolledToBottom) {
      setShowFeedbackModal(true);
      setHasShownFeedback(true);
    }
  }, [readingTime, hasScrolledToBottom, hasShownFeedback]);

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ 
      content, 
      parentCommentId = null,
      files = []
    }: { 
      content: string; 
      parentCommentId?: number | null;
      files?: File[];
    }) => {
      const formData = new FormData();
      
      formData.append('question_id', String(question_id));
      formData.append('comment', content);
      
      if (parentCommentId) {
        formData.append('parent_comment_id', String(parentCommentId));
      }
      
      files.forEach(file => {
        formData.append('attachments', file);
      });

      return await instance.post('/question/comment', formData);
    },
    onSuccess: () => {
      toast.success(replyTo ? "Reply added successfully" : "Comment added successfully");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['question', question_id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.msg || error.response?.data?.message || "Failed to add comment");
      console.error("Comment error:", error.response?.data);
    }
  });

  // Answer mutation
  const answerMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files: File[] }) => {
      const formData = new FormData();
      
      formData.append('question_id', String(question_id));
      formData.append('content', content);
      
      files.forEach(file => {
        formData.append('attachments', file);
      });
      
      return await instance.post('/answer', formData);
    },
    onSuccess: () => {
      toast.success("Answer added successfully");
      queryClient.invalidateQueries({ queryKey: ['question', question_id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add answer");
      console.error("Answer error:", error.response?.data);
    }
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ questionId, answerId, like }: { questionId?: number; answerId?: number; like: boolean }) => {
      const payload: any = { like };
      if (questionId) payload.question_id = questionId;
      if (answerId) payload.answer_id = answerId;
      
      return await instance.post('/question/like', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', question_id] });
      queryClient.invalidateQueries({ queryKey: ['question-like-status', question_id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update like");
    }
  });

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

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async ({ content, rating, question_id }: { content: string; rating: number; question_id: number }) => {
      return await instance.post('/question/feedback', {
        content,
        rating,
        question_id
      });
    },
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      setShowFeedbackModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    }
  });

  const handleDownload = async (attachmentId: number, filename: string) => {
    try {
      const response = await instance.get(
        `/attachment/download/${attachmentId}`,
        {
          responseType: "blob",
          headers: {
            Accept: "application/octet-stream",
          },
        }
      );

      const contentType = response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download file");
    }
  };

  const handleLikeQuestion = () => {
    if (!question) return;
    
    likeMutation.mutate({ 
      questionId: question.question_id,
      like: !likeStatus?.question_is_liked
    });
  };

  const handleSaveQuestion = () => {
    if (!question) return;

    saveQuestionMutation.mutate(question.question_id);
  };

  const handleLikeAnswer = ({answerId}:{answerId: number}) => {
    if (!question) return;

    const answerObj = question.answers.find(a => a.answer_id === answerId);
    const currentLikeStatus = answerObj?.is_liked ?? false;
    likeMutation.mutate({ 
      answerId,
      like: !currentLikeStatus
    });
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return "📄";
      case "docx": case "doc": return "📝";
      case "xlsx": case "xls": return "📊";
      case "pptx": case "ppt": return "📊";
      case "png": case "jpg": case "jpeg": case "gif": case "webp": return "🖼️";
      case "mp4": case "avi": case "mov": return "🎥";
      case "mp3": case "wav": case "flac": return "🎵";
      case "zip": case "rar": case "7z": return "📦";
      case "txt": case "md": return "📃";
      default: return "📎";
    }
  };
  
  const canPreview = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const previewableExtensions = [
      "txt", "md", "json", "csv", "xml", "html", 
      "js", "css", "py", "java", "cpp", "c",
      "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "pdf"
    ];
    return previewableExtensions.includes(extension || "");
  };

  const isImageFile = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
    return imageExtensions.includes(extension || "");
  };

  const canUserAnswer = () => {
    if (!question) return false;
    
    console.log("canUserAnswer debug:", {
      username,
      collaborator_type: question.collaborator_type,
      collaborator: question.collaborator,
      hasUsername: !!username
    });
    
    // If collaborator_type is NONE or collaborator is null, anyone can answer
    if (question.collaborator_type === "NONE" || question.collaborator === null) {
      return true;
    }
    
    // If collaborator exists but is empty array, anyone can answer
    if (Array.isArray(question.collaborator) && question.collaborator.length === 0) {
      return true;
    }
    
    // If collaborators are assigned, only they can answer (and user must be logged in)
    if (Array.isArray(question.collaborator) && question.collaborator.length > 0) {
      if (!username) return false;
      return question.collaborator.some(collaborator => collaborator.username === username);
    }
    
    // Default to allowing answers if structure is unexpected
    return true;
  };

  const handlePreview = async (attachment: Attachment) => {
    if (!canPreview(attachment.file_name)) return;

    setIsPreviewLoading(true);
    setPreviewFile(attachment);

    try {
      const extension = attachment.file_name.split(".").pop()?.toLowerCase();

      if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(extension || "")) {
        const response = await instance.get(
          `/attachment/download/${attachment.attachment_id}`,
          { responseType: "blob" }
        );
        const imageUrl = URL.createObjectURL(response.data);
        setPreviewContent({ type: "image", content: imageUrl });
      } else if (["txt", "md", "json", "csv", "xml", "html", "js", "css", "py", "java", "cpp", "c"].includes(extension || "")) {
        const response = await instance.get(
          `/attachment/download/${attachment.attachment_id}`,
          { responseType: "text" }
        );
        setPreviewContent({ type: "text", content: response.data });
      } else if (extension === "pdf") {
        const response = await instance.get(
          `/attachment/download/${attachment.attachment_id}`,
          { responseType: "blob" }
        );
        const pdfUrl = URL.createObjectURL(response.data);
        setPreviewContent({ type: "pdf", content: pdfUrl });
      }
    } catch (error) {
      console.error("Preview failed:", error);
      setPreviewContent({ type: "error", content: "Failed to load file preview" });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewContent && previewContent.content && previewContent.type !== "text" && previewContent.type !== "error") {
      URL.revokeObjectURL(previewContent.content);
    }
    setPreviewFile(null);
    setPreviewContent(null);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Horizontal Scrollable Attachment Component
  const AttachmentCarousel = ({ attachments, title }: { attachments: Attachment[], title: string }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      }
    };

    const scrollRight = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      }
    };

    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">
            {title} ({attachments.length})
          </h3>
          {attachments.length > 2 && (
            <div className="flex space-x-1">
              <button
                onClick={scrollLeft}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <button
                onClick={scrollRight}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          )}
        </div>
        
        <div 
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {attachments.map((attachment) => {
            if (isImageFile(attachment.file_name)) {
              return (
                <div
                  key={attachment.attachment_id}
                  className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getFileIcon(attachment.file_name)}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-medium text-gray-900 truncate" title={attachment.file_name}>
                          {attachment.file_name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.file_size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handlePreview(attachment)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Preview"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => handleDownload(attachment.attachment_id, attachment.file_name)}
                        className="p-1 text-green-600 hover:text-green-800 transition-colors"
                        title="Download"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    <img 
                      src={`http://localhost:4700/attachments/${attachment.file_name}`}
                      crossOrigin="use-credentials"
                      alt={attachment.file_name}
                      className="w-full h-auto max-h-40 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handlePreview(attachment)}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-center text-gray-500 text-xs py-4">
                      Image could not be loaded. <button onClick={() => handlePreview(attachment)} className="text-blue-600 hover:underline">Click to preview</button>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div
                  key={attachment.attachment_id}
                  className="flex-shrink-0 w-64 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                        {getFileIcon(attachment.file_name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate mb-1" title={attachment.file_name}>
                        {attachment.file_name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">
                        {formatFileSize(attachment.file_size)}
                      </p>
                      <div className="flex space-x-2">
                        {canPreview(attachment.file_name) && (
                          <button
                            onClick={() => handlePreview(attachment)}
                            className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            <Eye size={12} className="mr-1" />
                            Preview
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(attachment.attachment_id, attachment.file_name)}
                          className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          <Download size={12} className="mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  // Enhanced Attachment Display for Comments/Replies
  const AttachmentList = ({ attachments }: { attachments: Attachment[] }) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-3">
        <h4 className="text-xs font-medium text-gray-500 mb-2">Attachments:</h4>
        <div className="space-y-2">
          {attachments.map(attachment => {
            if (isImageFile(attachment.file_name)) {
              return (
                <div key={attachment.attachment_id} className="bg-white rounded border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getFileIcon(attachment.file_name)}</span>
                      <div>
                        <p className="text-xs font-medium text-gray-900" title={attachment.file_name}>
                          {attachment.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.file_size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handlePreview(attachment)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDownload(attachment.attachment_id, attachment.file_name)}
                        className="p-1 text-green-600 hover:text-green-800 transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    <img 
                      src={`http://localhost:4700/attachments/${attachment.file_name}`}
                      crossOrigin="use-credentials"
                      alt={attachment.file_name}
                      className="w-full h-auto max-h-64 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handlePreview(attachment)}
                      onError={(e) => {
                        // If image fails to load, show placeholder
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-center text-gray-500 text-sm py-8">
                      Image could not be loaded. <button onClick={() => handlePreview(attachment)} className="text-blue-600 hover:underline">Click to preview</button>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div 
                  key={attachment.attachment_id} 
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:shadow-sm transition-shadow group"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{getFileIcon(attachment.file_name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate" title={attachment.file_name}>
                        {attachment.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canPreview(attachment.file_name) && (
                      <button
                        onClick={() => handlePreview(attachment)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(attachment.attachment_id, attachment.file_name)}
                      className="p-1 text-green-600 hover:text-green-800 transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  const renderComments = (comments: Comment[], limit?: number) => {
    const commentsToShow = limit ? comments.slice(0, limit) : comments;

    return commentsToShow.map((comment) => (
      <div key={comment.comment_id} className="bg-gray-50 rounded-lg p-4 mb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {comment.user.username[0].toUpperCase()}
            </div>
            <div>
              <span className="font-medium text-gray-900">
                {comment.user.username}
              </span>
              {comment.user.division && (
                <span className="text-sm text-gray-500 ml-2">
                  • {comment.user.division.division_name}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {formatDate(comment.created_at)}
          </span>
        </div>
        <p className="text-gray-700 mb-2 whitespace-pre-wrap">{comment.content}</p>
        
        {/* Comment Attachments - Enhanced */}
        <AttachmentList attachments={comment.attachment} />
        
        <button
          onClick={() => setReplyTo(comment.comment_id)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-3"
        >
          <MessageSquare size={14} className="mr-1" />
          Reply
        </button>

        {/* Reply form */}
        {replyTo === comment.comment_id && (
          <div className="mt-3">
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Replying to {comment.user.username}</span>
              <button 
                onClick={() => setReplyTo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            <Formik
              initialValues={{ content: '', files: [] as File[] }}
              validationSchema={commentSchema}
              onSubmit={(values, { resetForm }) => {
                commentMutation.mutate({
                  content: values.content,
                  parentCommentId: comment.comment_id,
                  files: values.files
                });
                resetForm();
              }}
            >
              {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                <Form>
                  <div className="flex flex-col">
                    <Field
                      as="textarea"
                      name="content"
                      placeholder="Write a reply..."
                      className="flex-1 p-2 border border-gray-300 rounded-t-md resize-none text-sm"
                      rows={2}
                    />
                    {errors.content && touched.content && (
                      <div className="text-red-500 text-xs mt-1">{errors.content}</div>
                    )}
                    <div className="border border-t-0 border-gray-300 rounded-b-md p-2 bg-gray-50">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Add attachments
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            setFieldValue('files', Array.from(e.target.files));
                          }
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {values.files.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Selected: {values.files.map(f => f.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={commentMutation.isPending || isSubmitting}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {commentMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send size={16} className="mr-1" />
                          Post Reply
                        </>
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}

        {/* Render replies - Enhanced */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 mt-3 space-y-2">
            {comment.replies.map((reply) => (
              <div key={reply.comment_id} className="bg-white rounded p-3 border-l-2 border-blue-200">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {reply.user.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {reply.user.username}
                    </span>
                    {reply.user.division && (
                      <span className="text-xs text-gray-500">
                        • {reply.user.division.division_name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(reply.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                
                {/* Reply Attachments - Enhanced */}
                <AttachmentList attachments={reply.attachment} />
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Question Not Found
          </h2>
          <p className="text-gray-600 mb-4">{error?.message || "Failed to load question"}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Questions
        </button>

        {/* Question Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          {/* Question Title & Stats */}
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex-1">
              {question.title}
            </h1>
            <div className="flex items-center space-x-6 text-sm ml-6">
              <button 
                onClick={handleLikeQuestion}
                disabled={likeMutation.isPending}
                className={`flex items-center space-x-1 ${
                  likeStatus?.question_is_liked ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
                } disabled:opacity-50`}
                title={likeStatus?.question_is_liked ? "Unlike this question" : "Like this question"}
              >
                <ThumbsUp size={16} className={likeStatus?.question_is_liked ? "fill-yellow-500" : ""} />
                <span className="font-semibold">{question.like_count.likes}</span>
              </button>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">💬</span>
                <span>{question.comments.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-green-500">✅</span>
                <span>{question.total_answer}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star size={16} className="text-yellow-500" />
                <span>{question.average_rating ? question.average_rating.toFixed(1) : '0.0'}</span>
              </div>
              <button
                onClick={handleSaveQuestion}
                disabled={saveQuestionMutation.isPending}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 disabled:opacity-50 transition-colors"
                title="Save this question"
              >
                <Bookmark size={16} className={saveQuestionMutation.isPending ? "animate-pulse" : ""} />
                <span className="text-sm">Save</span>
              </button>
            </div>
          </div>

          {/* Question Meta */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {question.creator.username[0].toUpperCase()}
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  {question.creator.username}
                </span>
                {question.creator.division && (
                  <span className="text-sm text-gray-500 block">
                    {question.creator.division.division_name}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {formatDate(question.created_at)}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <span
                  key={tag.tag_id}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {tag.tag_name}
                </span>
              ))}
            </div>
          </div>

          {/* Question Content */}
          <div className="mb-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {question.content}
            </p>
          </div>

          {/* Collaborators */}
          {question?.collaborator?.length > 0 ? (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Collaborators:
              </h3>
              <div className="flex flex-wrap gap-2">
                {question.collaborator.map((collab) => (
                  <span
                    key={collab.user_id}
                    className="text-sm text-gray-600 bg-white px-2 py-1 rounded border"
                  >
                    {collab.username}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500">Open Question.</p>
            </div>
          )}

          {/* Enhanced Attachments Section */}
          <AttachmentCarousel attachments={question.attachment} title="Attachments" />
        </div>

        {/* Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl max-h-[95vh] w-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getFileIcon(previewFile.file_name)}</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{previewFile.file_name}</h3>
                    <p className="text-sm text-gray-500">{formatFileSize(previewFile.file_size)}</p>
                  </div>
                </div>
                <button onClick={closePreview} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {isPreviewLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : previewContent ? (
                  <div className="h-full flex items-center justify-center">
                    {previewContent.type === "image" && (
                      <img src={previewContent.content} alt={previewFile.file_name} className="max-w-full max-h-[70vh] object-contain" />
                    )}
                    {previewContent.type === "text" && (
                      <pre className="w-full bg-gray-50 p-4 rounded overflow-auto text-sm font-mono">
                        {previewContent.content}
                      </pre>
                    )}
                    {previewContent.type === "pdf" && (
                      <iframe src={previewContent.content} className="w-full h-[70vh]" title={previewFile.file_name} />
                    )}
                    {previewContent.type === "error" && (
                      <div className="text-center text-red-600">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p>{previewContent.content}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    No preview available
                  </div>
                )}
              </div>

              <div className="border-t p-4 flex justify-end space-x-3">
                <button onClick={closePreview} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  Close
                </button>
                <button
                  onClick={() => handleDownload(previewFile.attachment_id, previewFile.file_name)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={(data) => feedbackMutation.mutate(data)}
          isSubmitting={feedbackMutation.isPending}
          questionId={Number(question_id)}
        />

        {/* Answer Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Answer</h2>
          
          {!canUserAnswer() && question?.collaborator_type !== "NONE" && question?.collaborator && question.collaborator.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium text-yellow-800">Restricted Question</span>
              </div>
              <p className="text-sm text-yellow-700">
                This question has been assigned to specific collaborators. Only the following users can provide answers:
              </p>
              <ul className="mt-2 text-sm text-yellow-700">
                {question.collaborator.map((collaborator, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                    {collaborator.username}
                    {collaborator.division && (
                      <span className="ml-2 text-yellow-600">({collaborator.division.division_name})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canUserAnswer() ? (
            <Formik
              initialValues={{ content: '', files: [] as File[] }}
              validationSchema={answerSchema}
              onSubmit={(values, { resetForm }) => {
                answerMutation.mutate({
                  content: values.content,
                  files: values.files
                });
                resetForm();
              }}
            >
              {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                <Form className="space-y-4">
                <div>
                  <Field
                    as="textarea"
                    name="content"
                    placeholder="Write your answer here..."
                    className="w-full p-4 border border-gray-300 rounded-md resize-none min-h-[120px]"
                    rows={6}
                  />
                  {errors.content && touched.content && (
                    <div className="text-red-500 text-sm mt-1">{errors.content}</div>
                  )}
                </div>
                <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                  <label className="flex items-center cursor-pointer">
                    <Paperclip className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Add attachments</span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setFieldValue('files', Array.from(e.target.files));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {values.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {values.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-gray-600">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = values.files.filter((_, i) => i !== index);
                              setFieldValue('files', newFiles);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={answerMutation.isPending || isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {answerMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Posting...
                      </>
                    ) : (
                      "Post Answer"
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600">
                You cannot answer this question as it has been assigned to: {' '}
                <span className="font-medium text-gray-800">
                  {question?.collaborator?.map(c => c.username).join(', ')}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Existing Answers */}
        {question.answers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Answers ({question.total_answer})
            </h2>
            <div className="space-y-4">
              {question.answers
                .sort((a, b) => {
                  // Sort accepted answers first
                  if (a.is_accepted && !b.is_accepted) return -1;
                  if (!a.is_accepted && b.is_accepted) return 1;
                  return 0;
                })
                .map((answer) => (
                <div 
                  key={answer.answer_id} 
                  className={`border-l-4 pl-4 py-3 rounded-r ${
                    answer.is_accepted 
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50' 
                      : 'border-green-400 bg-green-50'
                  }`}
                >
                  {/* Accepted Badge - positioned above content */}
                  {answer.is_accepted && (
                    <div className="flex items-center space-x-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium mb-3 w-fit">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Accepted Answer</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                        answer.is_accepted ? 'bg-emerald-600' : 'bg-green-500'
                      }`}>
                        {answer.is_accepted ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          answer.user.username[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className={`font-medium ${answer.is_accepted ? 'text-emerald-900' : 'text-gray-900'}`}>
                          {answer.user.username}
                        </span>
                        {answer.user.division && (
                          <span className={`text-sm ml-2 ${answer.is_accepted ? 'text-emerald-600' : 'text-gray-500'}`}>
                            • {answer.user.division.division_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => (handleLikeAnswer({answerId: answer.answer_id}))}
                        disabled={likeMutation.isPending}
                        className={`flex items-center space-x-1 ${
                          answer.is_liked ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
                        } disabled:opacity-50`}
                        title={answer.is_liked ? "Unlike this answer" : "Like this answer"}
                      >
                        <ThumbsUp size={16} className={answer.is_liked ? "fill-yellow-500" : ""} />
                        <span className="text-xs">{answer.likes_count || 0}</span>
                      </button>
                      <span className="text-xs text-gray-500">
                        {formatDate(answer.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className={`whitespace-pre-wrap leading-relaxed ${
                    answer.is_accepted ? 'text-emerald-800' : 'text-gray-700'
                  }`}>
                    {answer.content}
                  </p>
                  
                  {/* Answer Attachments - Enhanced */}
                  <AttachmentList attachments={answer.attachment || []} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Discussion ({question.comments.length})
          </h2>

          {/* Add Comment Form */}
          <Formik
            initialValues={{ content: '', files: [] as File[] }}
            validationSchema={commentSchema}
            onSubmit={(values, { resetForm }) => {
              commentMutation.mutate({
                content: values.content,
                files: values.files
              });
              resetForm();
            }}
          >
            {({ values, errors, touched, setFieldValue, isSubmitting }) => (
              <Form className="mb-6">
                <div>
                  <Field
                    as="textarea"
                    name="content"
                    placeholder="Add a comment..."
                    className="w-full p-3 border border-gray-300 rounded-t-md resize-none"
                    rows={3}
                  />
                  {errors.content && touched.content && (
                    <div className="text-red-500 text-sm mt-1">{errors.content}</div>
                  )}
                </div>
                <div className="border border-t-0 border-gray-300 rounded-b-md p-3 bg-gray-50">
                  <label className="flex items-center cursor-pointer">
                    <Paperclip className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Add attachments</span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setFieldValue('files', Array.from(e.target.files));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {values.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {values.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-gray-600">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = values.files.filter((_, i) => i !== index);
                              setFieldValue('files', newFiles);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={commentMutation.isPending || isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {commentMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      "Add Comment"
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          {/* Comments List */}
          <div className="space-y-3">
            {question.comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <>
                {renderComments(question.comments, showAllComments ? undefined : 3)}
                {question.comments.length > 3 && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowAllComments(!showAllComments)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showAllComments ? "Show Less" : `Show All ${question.comments.length} Comments`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default QuestionDetailsPage;