'use client'
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import instance from "@/utils/axiosInstance";
import LoadingWithSpinner from "@/Components/loadingWithSpinner";
import { Calendar, MessageCircle, Clock, CheckCircle, AlertCircle, XCircle, User } from "lucide-react";

export default function MyQuestionsPage() {
    const {data: myQuestions, isLoading, isError} = useQuery({
        queryKey: ['My-Questions'],
        queryFn: async() => {
            const response = await instance.get('/profile/questions')
            return response.data.data
        }
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ANSWERED': return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
            case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="w-4 h-4" />;
            case 'ASSIGNED': return <User className="w-4 h-4" />;
            case 'ANSWERED': return <CheckCircle className="w-4 h-4" />;
            case 'REJECTED': return <XCircle className="w-4 h-4" />;
            case 'CLOSED': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

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

    if(isLoading) return <LoadingWithSpinner />
    
    if(isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <div className="flex items-center">
                        <XCircle className="w-6 h-6 text-red-500 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-800">Error Loading Questions</h3>
                            <p className="text-red-600">There was a problem loading your questions. Please try again.</p>
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Questions</h1>
                    <p className="text-gray-600">
                        {myQuestions?.length > 0 
                            ? `You have ${myQuestions.length} question${myQuestions.length !== 1 ? 's' : ''}`
                            : 'No questions found'
                        }
                    </p>
                </div>

                {/* Questions List */}
                {myQuestions?.length > 0 ? (
                    <div className="space-y-6">
                        {myQuestions.map((question: any) => (
                            <div 
                                key={question.question_id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
                            >
                                <div className="p-6">
                                    {/* Header with title and status */}
                                    <div className="flex items-start justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-gray-900 flex-1 pr-4">
  <Link href={`/my-questions/${question.question_id}`} className="hover:underline hover:text-blue-600 transition-colors duration-200">
    {question.title}
  </Link>
</h2>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(question.status)}`}>
                                            {getStatusIcon(question.status)}
                                            <span className="ml-1 capitalize">{question.status.toLowerCase()}</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="mb-4">
                                        <p className="text-gray-700 leading-relaxed">
                                            {truncateContent(question.content)}
                                        </p>
                                    </div>

                                    {/* Footer with metadata */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            <span>Created {formatDate(question.created_at)}</span>
                                        </div>
                                        
                                        {/* Additional metadata could go here */}
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            {question.due_date && (
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    <span>Due {formatDate(question.due_date)}</span>
                                                </div>
                                            )}
                                            {question.answers && question.answers.length > 0 && (
                                                <div className="flex items-center">
                                                    <MessageCircle className="w-4 h-4 mr-1" />
                                                    <span>{question.answers.length} answer{question.answers.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            )}
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
                            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Yet</h3>
                            <p className="text-gray-600 mb-6">You haven't created any questions yet. Start by asking your first question!</p>
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                                Create Question
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}