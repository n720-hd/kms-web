'use client'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import LoadingWithSpinner from "@/Components/loadingWithSpinner"
import instance from "@/utils/axiosInstance"
import { Calendar, User, Bookmark, ExternalLink, BookmarkX, XCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "react-toastify"

export default function SavedQuestionsPage() {
    const queryClient = useQueryClient();
    const {data: savedQuestions, isLoading, isError} = useQuery({
        queryKey: ['Saved-Questions'],
        queryFn: async () => {
            const response = await instance.get('/profile/saved')
            return response.data.data
        }
    })

    const {mutate: removeSavedQuestion} = useMutation({
        mutationFn: async (question_id: number) => {
            const response = await instance.post(`/question/save`,{question_id})
            return response.data.data
        },
        onSuccess: (res) => {
            toast.success(res.message || 'Question removed from saved successfully')
            queryClient.invalidateQueries({queryKey: ['Saved-Questions']})
        },
        onError: (error) => {
            console.error("Error removing saved question", error)
        }
    })

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.slice(0, maxLength) + '...';
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return formatDate(dateString);
    };

    if (isLoading) return <LoadingWithSpinner/>
    
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <div className="flex items-center">
                        <XCircle className="w-6 h-6 text-red-500 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-800">Error Loading Saved Questions</h3>
                            <p className="text-red-600">There was a problem loading your saved questions. Please try again.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center mb-2">
                        <Bookmark className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">Saved Questions</h1>
                    </div>
                    <p className="text-gray-600">
                        {savedQuestions?.length > 0 
                            ? `You have saved ${savedQuestions.length} question${savedQuestions.length !== 1 ? 's' : ''}`
                            : 'No saved questions found'
                        }
                    </p>
                </div>

                {/* Saved Questions List */}
                {savedQuestions && savedQuestions?.length > 0 ? (
                    <div className="space-y-6">
                        {savedQuestions.map((savedQuestion: any) => (
                            <div 
                                key={savedQuestion.saved_question_id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group"
                            >
                                <div className="p-6">
                                    {/* Header with title and bookmark indicator */}
                                    <div className="flex items-start justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-gray-900 flex-1 pr-4 group-hover:text-blue-600 transition-colors duration-200">
                                            {savedQuestion.question.title}
                                        </h2>
                                        <div className="flex items-center space-x-2">
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                <Bookmark className="w-3 h-3 mr-1 fill-current" />
                                                <span>Saved</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="mb-4">
                                        <p className="text-gray-700 leading-relaxed">
                                            {truncateContent(savedQuestion.question.content)}
                                        </p>
                                    </div>

                                    {/* Creator info */}
                                    <div className="mb-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0">
                                            {savedQuestion.question.creator.profile_picture ? (
                                                <img 
                                                    src={savedQuestion.question.creator.profile_picture.startsWith('https://') 
                                                        ? savedQuestion.question.creator.profile_picture 
                                                        : `http://localhost:4700/attachments/${savedQuestion.question.creator.profile_picture}`}
                                                    alt={`${savedQuestion.question.creator.first_name} ${savedQuestion.question.creator.last_name}`}
                                                    crossOrigin="use-credentials"
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-gray-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {savedQuestion.question.creator.first_name} {savedQuestion.question.creator.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                @{savedQuestion.question.creator.username}
                                            </p>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Created {getTimeAgo(savedQuestion.question.created_at)}
                                        </div>
                                    </div>

                                    {/* Footer with metadata and actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                <span>Saved {getTimeAgo(savedQuestion.created_at)}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                            <button
  className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 hover:bg-red-50 rounded-lg"
  title="Remove from saved"
  onClick={() => removeSavedQuestion(savedQuestion.question_id)}
>
  <BookmarkX className="w-4 h-4" />
</button>
                                            <Link 
                                                href={`/questions/${savedQuestion.question.question_id}`}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                            >
                                                <span>View Question</span>
                                                <ExternalLink className="w-4 h-4 ml-2" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-12">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
                            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Questions</h3>
                            <p className="text-gray-600 mb-6">You haven't saved any questions yet. Start exploring and save interesting questions for later!</p>
                            <Link 
                                href="/questions"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 inline-block"
                            >
                                Browse Questions
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}