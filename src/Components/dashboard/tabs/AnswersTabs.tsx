"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X,
  MessageSquare,
  User,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Answer {
  answer_id: number;
  content: string;
  is_accepted: boolean;
  created_at: string;
  updated_at: string | null;
  user: {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  };
  question: {
    question_id: number;
    title: string;
  };
}

interface AnswersResponse {
  data: Answer[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

interface AnswerTabsProps {
  answersData?: AnswersResponse;
  isLoading: boolean;
  onSearch: (search: string) => void;
  onFilter: (filter: 'newest' | 'oldest' | 'pending' | null) => void;
  onPageChange: (page: number) => void;
  onApprove: (answerId: number) => void;
  currentPage: number;
  currentSearch: string;
  currentFilter: 'newest' | 'oldest' | 'pending' | null;
  formatDate: (dateString: string) => string;
  isApproving: boolean;
}

const AnswerTabs: React.FC<AnswerTabsProps> = ({
  answersData,
  isLoading,
  onSearch,
  onFilter,
  onPageChange,
  onApprove,
  currentPage,
  currentSearch,
  currentFilter,
  formatDate,
  isApproving
}) => {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [showFilters, setShowFilters] = useState(false);

  // Update search input when currentSearch changes
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  // Handle filter selection
  const handleFilterSelect = (filter: 'newest' | 'oldest' | 'pending' | null) => {
    onFilter(filter);
    setShowFilters(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchInput('');
    onSearch('');
    onFilter(null);
  };

  const getFilterLabel = (filter: string | null) => {
    switch (filter) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'pending': return 'Pending Approval';
      default: return 'All Answers';
    }
  };

  const getStatusBadge = (isAccepted: boolean) => {
    return isAccepted ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Check className="w-3 h-3 mr-1" />
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  // Pagination component
  const PaginationControls = () => {
    if (!answersData?.pagination) return null;

    const { currentPage, totalPages, hasNextPage, hasPrevPage } = answersData.pagination;

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrevPage}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span> pages
              {answersData.pagination.totalItems && (
                <span className="ml-1">
                  ({answersData.pagination.totalItems} total answers)
                </span>
              )}
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrevPage}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      pageNum === currentPage
                        ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Answer Management</h2>
          <p className="text-sm text-gray-500">
            Review and manage user answers
          </p>
        </div>
        
        {/* Summary Stats */}
        {answersData?.pagination && (
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Total: {answersData.pagination.totalItems} answers
            </p>
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search answers, users, or questions..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Filter className="w-4 h-4 mr-2" />
              {getFilterLabel(currentFilter)}
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => handleFilterSelect(null)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    All Answers
                  </button>
                  <button
                    onClick={() => handleFilterSelect('newest')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => handleFilterSelect('oldest')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Oldest First
                  </button>
                  <button
                    onClick={() => handleFilterSelect('pending')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Pending Approval
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters */}
          {(currentSearch || currentFilter) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Answers List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading answers...</p>
          </div>
        ) : answersData?.data?.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No answers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {currentSearch || currentFilter 
                ? 'Try adjusting your search or filters'
                : 'No answers have been submitted yet'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {answersData?.data?.map((answer) => (
              <div key={answer.answer_id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Question Title */}
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-blue-600 truncate">
                        Q: {answer.question.title}
                      </h4>
                    </div>

                    {/* Answer Content */}
                    <div className="mb-3">
                      <p className="text-gray-900 text-sm line-clamp-3">
                        {answer.content}
                      </p>
                    </div>

                    {/* User and Date Info */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        <span>
                          {answer.user.first_name} {answer.user.last_name} 
                          {answer.user.username && ` (@${answer.user.username})`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{formatDate(answer.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    {getStatusBadge(answer.is_accepted)}
                    
                    {!answer.is_accepted && (
                      <button
                        onClick={() => onApprove(answer.answer_id)}
                        disabled={isApproving}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApproving ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(answersData?.data?.length ?? 0) > 0 && <PaginationControls />}
      </div>
    </div>
  );
};

export default AnswerTabs;