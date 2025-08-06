"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import QuestionCard from "@/Components/QuestionCard";
import instance from "@/utils/axiosInstance";
import { toast } from "react-toastify";

interface Creator {
  user_id: string;
  username: string;
  email: string;
  profile_picture?: string; // Updated to match your service
}

interface QuestionTag {
  id: string;
  name: string;
}

interface Question {
  id: number;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  creator: Creator;
  collaborator?: Creator;
  tags: QuestionTag[];
  likes_count: number;
  comments_count: number;
  answers_count: number;
  has_accepted_answer: boolean;
  average_rating: number;
}

interface SearchResponse {
  data: Question[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  metadata: {
    search: string;
    sortBy: string;
    sortOrder: string;
    tags: string[];
    appliedFilters: {
      hasSearch: boolean;
      hasTags: boolean;
      isFiltered: boolean;
    };
  };
}

const QuestionsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parameters
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const tagsParam = searchParams.get("tags") || "";
  const pageParam = parseInt(searchParams.get("page") || "1");
  const limitParam = parseInt(searchParams.get("limit") || "10");

  const selectedTags = tagsParam
    ? tagsParam.split(",").filter((tag) => tag.trim())
    : [];

  // Fetch questions
  const { data, isLoading, isError, error } = useQuery<SearchResponse>({
    queryKey: [
      "questions",
      search,
      sortBy,
      sortOrder,
      selectedTags,
      pageParam,
      limitParam,
    ],
    queryFn: async () => {
      try {
        const params: any = {
          sortBy,
          sortOrder,
          page: pageParam,
          limit: limitParam,
        };

        if (search.trim()) params.search = search;
        if (selectedTags.length > 0) params.tags = selectedTags.join(",");

        const res = await instance.get("/question", { params });

        console.log("API Response:", res.data); // Debug log

        // Handle your API response structure
        if (!res.data || res.data.error) {
          throw new Error(res.data?.message || "Failed to fetch questions");
        }

        // Your API returns { error: false, data: {...}, message: string }
        const apiData = res.data.data || res.data; // Fallback if controller returns service data directly

        if (!apiData) {
          throw new Error("No data received from server");
        }

        // Return the properly structured data
        return {
          data: apiData.data || [],
          pagination: apiData.pagination || {
            total: 0,
            page: pageParam,
            limit: limitParam,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
          metadata: apiData.metadata || {
            search: search,
            sortBy: sortBy,
            sortOrder: sortOrder,
            tags: selectedTags,
            appliedFilters: {
              hasSearch: !!search.trim(),
              hasTags: selectedTags.length > 0,
              isFiltered: !!search.trim() || selectedTags.length > 0,
            },
          },
        };
      } catch (error) {
        console.error("API Error:", error); // Debug log
        throw error;
      }
    },
    retry: (failureCount, error) => {
      console.log("Query retry attempt:", failureCount, error); // Debug log
      if (failureCount < 3) {
        const errorMessage = error?.message?.toLowerCase() || "";
        return (
          !errorMessage.includes("400") &&
          !errorMessage.includes("401") &&
          !errorMessage.includes("403") &&
          !errorMessage.includes("404")
        );
      }
      return false;
    },
  });

  const saveQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return await instance.post("/question/save", { question_id: questionId });
    },
    onSuccess: () => {
      toast.success("Question saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save question");
    },
  });

  const updateURL = (newParams: { [key: string]: string | number | null }) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, value]) => {
      if (
        value === null ||
        value === "" ||
        value === "created_at" ||
        value === "desc" ||
        value === 1 ||
        value === undefined
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    // Always reset to page 1 when changing filters
    if ("page" in newParams && newParams.page !== pageParam) {
      // Keep the page change
    } else if (Object.keys(newParams).some((key) => key !== "page")) {
      params.delete("page");
    }

    const queryString = params.toString();
    router.push(`/questions${queryString ? `?${queryString}` : ""}`);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
    updateURL({ tags: newTags.length > 0 ? newTags.join(",") : null });
  };

  const clearAllFilters = () => {
    router.push("/questions");
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">
              Error loading questions
            </div>
            <p className="text-gray-600">
              {error?.message || "Something went wrong"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Debug Information - Remove this in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg text-xs">
            <div><strong>Debug Info:</strong></div>
            <div>Search: "{search}"</div>
            <div>Sort: {sortBy} - {sortOrder}</div>
            <div>Tags: [{selectedTags.join(', ')}]</div>
            <div>Page: {pageParam}, Limit: {limitParam}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Error: {isError ? 'Yes' : 'No'}</div>
            <div>Data: {data ? 'Available' : 'None'}</div>
            {data && (
              <>
                <div>Questions Count: {data.data?.length || 0}</div>
                <div>Total: {data.pagination?.total || 'N/A'}</div>
              </>
            )}
          </div>
        )} */}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {search ? `Search Results for "${search}"` : "All Questions"}
            </h1>
            <button
              onClick={() => router.push("/questions/ask")}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Ask Question
            </button>
          </div>

          {/* Active Filters */}
          {(search || selectedTags.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-4 bg-white rounded-lg border">
              <span className="text-sm font-medium text-gray-700">
                Active filters:
              </span>

              {search && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  <Search className="h-3 w-3 mr-1" />
                  {search}
                </span>
              )}

              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-orange-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Results Summary */}
          {data && data.pagination && (
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <div>
                Showing {(pageParam - 1) * limitParam + 1} -{" "}
                {Math.min(pageParam * limitParam, data.pagination.total)} of{" "}
                {data.pagination.total} questions
              </div>
              <div className="flex items-center space-x-2">
                <span>Sort by:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split("-");
                    updateURL({ sortBy: newSortBy, sortOrder: newSortOrder });
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created_at-desc">Newest</option>
                  <option value="created_at-asc">Oldest</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="likes_count-desc">Most Likes</option>
                  <option value="answers_count-desc">Most Answers</option>
                  <option value="comments_count-desc">Most Comments</option>
                  <option value="rating-desc">Highest Rated</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading questions...</span>
          </div>
        )}

        {/* Questions List */}
        {data && data.data && data.data.length > 0 && (
          <div className="space-y-4 mb-8">
            {data.data.map((question) => (
              <QuestionCard
                key={question.id}
                question={{
                  id: question.id,
                  title: question.title,
                  content: question.content,
                  status: question.status,
                  created_at: question.created_at,
                  creator: question.creator,
                  tags: question.tags,
                  likes_count: question.likes_count,
                  comments_count: question.comments_count,
                  answers_count: question.answers_count,
                  has_accepted_answer: question.has_accepted_answer,
                  average_rating: question.average_rating
                }}
                onTagClick={(tagName) => {
                  const newTags = [...selectedTags];
                  if (!newTags.includes(tagName)) {
                    newTags.push(tagName);
                    updateURL({ tags: newTags.join(",") });
                  }
                }}
                showSaveButton={true}
                compact={false}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {data && data.data && data.data.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No questions found
            </h3>
            <p className="text-gray-600 mb-6">
              {search || selectedTags.length > 0
                ? "Try adjusting your search or filters"
                : "Be the first to ask a question!"}
            </p>
            <div className="space-x-4">
              <button
                onClick={() => router.push("/questions/ask")}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Ask Question
              </button>
              <button
                onClick={() => router.push("/ai")}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Chat with AI
              </button>
              {(search || selectedTags.length > 0) && (
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateURL({ page: pageParam - 1 })}
                disabled={!data.pagination.hasPrevPage}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {Array.from(
                  { length: Math.min(5, data.pagination.totalPages) },
                  (_, i) => {
                    const page =
                      Math.max(
                        1,
                        Math.min(
                          data.pagination.totalPages - 4,
                          Math.max(1, pageParam - 2)
                        )
                      ) + i;

                    if (page > data.pagination.totalPages) return null;

                    return (
                      <button
                        key={page}
                        onClick={() => updateURL({ page })}
                        className={`px-3 py-2 text-sm rounded-md ${
                          page === pageParam
                            ? "bg-blue-500 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => updateURL({ page: pageParam + 1 })}
                disabled={!data.pagination.hasNextPage}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionsPage;
