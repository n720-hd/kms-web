'use client'
import { useQuery } from "@tanstack/react-query"
import instance from "@/utils/axiosInstance"
import LoadingWithSpinner from "@/Components/loadingWithSpinner"
import { Calendar, MessageSquare, CheckCircle, Clock, ExternalLink, XCircle, Award } from "lucide-react"
import Link from "next/link"

export default function MyAnswersPage() {
    const {data: myAnswers, isLoading, isError} = useQuery({
        queryKey: ['my-answers'],
        queryFn: async () => {
            const response = await instance.get('/profile/answers');
            return response.data.data
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

    const truncateContent = (content: string, maxLength: number = 200) => {
        if (content.length <= maxLength) return content;
        return content.slice(0, maxLength) + '...';
    };

    if (isLoading) return <LoadingWithSpinner />
    
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <div className="flex items-center">
                        <XCircle className="w-6 h-6 text-red-500 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-800">Error Loading Answers</h3>
                            <p className="text-red-600">There was a problem loading your answers. Please try again.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    console.log(myAnswers, isLoading, isError);
    
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center mb-2">
                        <MessageSquare className="w-8 h-8 text-green-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">My Answers</h1>
                    </div>
                    <p className="text-gray-600">
                        {myAnswers?.length > 0 
                            ? `You have provided ${myAnswers.length} answer${myAnswers.length !== 1 ? 's' : ''}`
                            : 'No answers found'
                        }
                    </p>
                    {myAnswers?.some((answer: any) => answer.is_accepted) && (
                        <div className="mt-2 flex items-center text-sm text-green-600">
                            <Award className="w-4 h-4 mr-1" />
                            <span>{myAnswers.filter((answer: any) => answer.is_accepted).length} accepted answer{myAnswers.filter((answer: any) => answer.is_accepted).length !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>

                {/* Answers List */}
                {myAnswers?.length > 0 ? (
                    <div className="space-y-6">
                        {myAnswers.map((answer: any) => (
                            <div 
                                key={answer.answer_id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group"
                            >
                                <div className="p-6">
                                    {/* Header with status */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center mb-2">
                                                <h2 className="text-lg font-semibold text-gray-900 mr-3">
                                                    Answer to Question #{answer.question_id}
                                                </h2>
                                                {answer.is_accepted ? (
                                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                        <CheckCircle className="w-3 h-3 mr-1 fill-current" />
                                                        <span>Accepted</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        <span>Pending</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Answer Content */}
                                    <div className="mb-4">
                                        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
                                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                {truncateContent(answer.content)}
                                            </p>
                                            {answer.content.length > 200 && (
                                                <button className="text-blue-600 text-sm hover:text-blue-800 mt-2 font-medium">
                                                    Read more...
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer with metadata and actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                <span>Answered {getTimeAgo(answer.created_at)}</span>
                                            </div>
                                            {answer.updated_at !== answer.created_at && (
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    <span>Updated {getTimeAgo(answer.updated_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                            <Link 
                                                href={`/questions/${answer.question_id}`}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                            >
                                                <span>View Question</span>
                                                <ExternalLink className="w-4 h-4 ml-2" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Accepted Answer Highlight */}
                                {answer.is_accepted && (
                                    <div className="bg-green-50 border-t border-green-100 px-6 py-3">
                                        <div className="flex items-center text-sm text-green-700">
                                            <Award className="w-4 h-4 mr-2" />
                                            <span className="font-medium">This answer was accepted by the question author</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-12">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Answers Yet</h3>
                            <p className="text-gray-600 mb-6">You haven't provided any answers yet. Start helping others by answering questions!</p>
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