'use client';
import { AlertTriangle, Eye, Filter, MoreVertical, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DashboardStats } from "../types";

interface Creator {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
}

interface Collaborator {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface Question {
  question_id: number;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  due_date: string;
  collaborator_type: string;
  is_published: boolean;
  creator: Creator;
  collaborator?: Collaborator;
  collaborator_division?: {
    id: number;
    division_name: string;
  };
  _count: {
    answers: number;
    comments: number;
    likes: number;
  };
}

interface QuestionsData {
  data: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface QuestionsTabProps {
  questionsData: QuestionsData;
  formatDate: (dateString: string) => string;
  takedownQuestion: (questionId: number) => void;
  onFilterChange: (status: string | null) => void;
  onPageChange: (page: number) => void;
  currentFilter: string | null;
  isLoading?: boolean;
  stats?: DashboardStats;
}

const QuestionsTab = ({
  questionsData, 
  formatDate, 
  takedownQuestion,
  onFilterChange,
  onPageChange,
  currentFilter,
  isLoading = false,
  stats
}: QuestionsTabProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{id: number, title: string} | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  console.log('QuestionsTab questionsData:', questionsData);
  console.log('Pagination data:', questionsData?.pagination);

  const handleTakedownClick = (questionId: number, questionTitle: string) => {
    setSelectedQuestion({id: questionId, title: questionTitle});
    setShowConfirmDialog(true);
  };

  const handleConfirmTakedown = () => {
    if (selectedQuestion) {
      takedownQuestion(selectedQuestion.id);
      setShowConfirmDialog(false);
      setSelectedQuestion(null);
    }
  };

  const handleCancelTakedown = () => {
    setShowConfirmDialog(false);
    setSelectedQuestion(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'ANSWERED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterOptions = [
    { value: null, label: 'All Questions' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'ANSWERED', label: 'Answered' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CLOSED', label: 'Closed' }
  ];

  const currentFilterLabel = filterOptions.find(option => option.value === currentFilter)?.label || 'All Questions';

  return (
    <div>
       <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingQuestions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Assigned</div>
            <div className="text-2xl font-bold text-blue-600">{stats?.assignedQuestions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Answered</div>
            <div className="text-2xl font-bold text-green-600">{stats?.answeredQuestions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{stats?.rejectedQuestions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Closed</div>
            <div className="text-2xl font-bold text-gray-600">{stats?.closedQuestions || 0}</div>
          </div>
        </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Question Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            {questionsData?.pagination ? 
              `${questionsData.pagination.totalItems} total questions` : 
              'Loading...'
            }
          </p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            {currentFilterLabel}
          </button>
          
          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {filterOptions.map((option) => (
                <button
                  key={option.value || 'all'}
                  onClick={() => {
                    onFilterChange(option.value);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    currentFilter === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {questionsData?.data?.map((question) => (
              <div key={question.question_id} className="bg-white border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {question.title}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
                        {question.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {question.content}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>by @{question.creator.username}</span>
                      <span>{question._count.answers} answers</span>
                      <span>{question._count.comments} comments</span>
                      <span>{question._count.likes} likes</span>
                      <span>{formatDate(question.created_at)}</span>
                    </div>
                    
                    {question.collaborator && (
                      <div className="mt-2 text-sm text-blue-600">
                        Assigned to: @{question.collaborator.username}
                      </div>
                    )}
                    
                    {question.collaborator_division && (
                      <div className="mt-1 text-sm text-purple-600">
                        Division: {question.collaborator_division.division_name}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleTakedownClick(question.question_id, question.title)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                      title="Takedown Question"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {questionsData?.pagination && questionsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border rounded-lg">
              <div className="text-sm text-gray-700">
                Showing {((questionsData.pagination.currentPage - 1) * questionsData.pagination.itemsPerPage) + 1} to{' '}
                {Math.min(questionsData.pagination.currentPage * questionsData.pagination.itemsPerPage, questionsData.pagination.totalItems)} of{' '}
                {questionsData.pagination.totalItems} results
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPageChange(questionsData.pagination.currentPage - 1)}
                  disabled={!questionsData.pagination.hasPrevPage}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {questionsData.pagination.currentPage} of {questionsData.pagination.totalPages}
                </span>
                
                <button
                  onClick={() => onPageChange(questionsData.pagination.currentPage + 1)}
                  disabled={!questionsData.pagination.hasNextPage}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Takedown</h3>
              <button 
                onClick={handleCancelTakedown}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Are you sure you want to takedown this question?
                  </h4>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="text-sm text-gray-700 font-medium">Question:</p>
                <p className="text-sm text-gray-600 mt-1">"{selectedQuestion?.title}"</p>
              </div>
              
              <p className="text-sm text-gray-500">
                This action will remove the question from public view. This action cannot be undone.
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCancelTakedown}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTakedown}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Takedown Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsTab;