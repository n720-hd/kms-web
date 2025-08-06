"use client";
import { Search, X, Menu, ChevronDown, Filter, Tag, Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import instance from "@/utils/axiosInstance";
import authStore from "@/zustand/authStore";
import { AvatarWithFallback } from "./avatar";
import { MobileAvatar } from "./mobileAvatar";
import { getNotificationColor, getNotificationIcon, getNotificationTitle } from "@/utils/notificationHelper";

interface Tag {
  id: string;
  name: string;
  count?: number;
}

interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[];
  // Add other question properties as needed
}

interface Notification {
  id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  user_id: number;
  question_id?: number;
  answer_id?: number;
  notification_type: string;
}

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const tagsDropdownRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const role = authStore((state) => state.role);

  useEffect(() => {
    if (role) {
      setIsLoggedIn(true);
    }
  }, [role]);

  // Initialize state from URL params
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlSortBy = searchParams.get("sortBy") || "created_at";
    const urlSortOrder = searchParams.get("sortOrder") || "desc";
    const urlTags = searchParams.get("tags")
      ? searchParams.get("tags")!.split(",")
      : [];

    setSearchQuery(urlSearch);
    setSortBy(urlSortBy);
    setSortOrder(urlSortOrder);
    setSelectedTags(urlTags);
  }, [searchParams]);

  // Fetch search results
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["search", searchQuery, sortBy, sortOrder, selectedTags],
    queryFn: async () => {
      if (!searchQuery.trim() && selectedTags.length === 0) return null;

      const res = await instance.get("/question", {
        params: {
          search: searchQuery,
          sortBy,
          sortOrder,
          tags: selectedTags.join(","),
          limit: 5,
        },
      });
      return res.data;
    },
    enabled: searchQuery.trim().length > 0 || selectedTags.length > 0,
  });

  // Fetch notifications
  const {
    data: notifications,
    isLoading: isNotificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!isLoggedIn) return null;
      const res = await instance.get("/question/notifications");
      return res.data;
    },
    enabled: isLoggedIn,
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch available tags
  const { data: tagsData, isLoading: isTagsLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await instance.get("/question/tags");
      return res.data;
    },
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
      if (
        tagsDropdownRef.current &&
        !tagsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTagsDropdown(false);
      }
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  const handleTagToggle = (tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter((tag) => tag !== tagName)
      : [...selectedTags, tagName];

    setSelectedTags(newTags);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setShowSortDropdown(false);
    
    // Immediately apply the sort
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery);
    if (newSortBy !== "created_at") params.set("sortBy", newSortBy);
    if (newSortOrder !== "desc") params.set("sortOrder", newSortOrder);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

    const queryString = params.toString();
    router.push(`/questions${queryString ? `?${queryString}` : ""}`);
  };

  const performSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery);
    if (sortBy !== "created_at") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

    const queryString = params.toString();
    router.push(`/questions${queryString ? `?${queryString}` : ""}`);
    setShowSearchResults(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSortBy("created_at");
    setSortOrder("desc");
    router.push("/questions");
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await instance.put(`/question/notifications/${notification.id}/read`);
        refetchNotifications();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    // Navigate based on notification type
    if (notification.question_id) {
      router.push(`/questions/${notification.question_id}`);
    } else if (notification.answer_id) {
      // If you have a direct route to answers, use it here
      router.push(`/answers/${notification.answer_id}`);
    }
    setShowNotifications(false);
  };

  // Count unread notifications
  const unreadCount =
    notifications?.data?.filter((n: Notification) => !n.is_read).length || 0;

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const sortOptions = [
    { value: "created_at", order: "desc", label: "Newest" },
    { value: "created_at", order: "asc", label: "Oldest" },
    { value: "title", order: "asc", label: "Title A-Z" },
    { value: "title", order: "desc", label: "Title Z-A" },
    {value: 'rating', order: 'desc', label: 'Highest Rated'},
    { value: "likes_count", order: "desc", label: "Most Likes" },
    { value: "answers_count", order: "desc", label: "Most Answers" },
    { value: "comments_count", order: "desc", label: "Most Comments" },
  ];

  return (
    <header className="bg-white border-t-4 border-orange-500 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Primary Nav */}
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <a href="/">
                <span className="text-2xl font-bold text-gray-800">
                  K <span className="font-normal">X</span>
                </span>
              </a>
            </div>
            <nav className="hidden md:flex space-x-4">
              <a
                href="/discussion"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Discussion
              </a>
            </nav>
          </div>

          {/* Search Bar with Controls */}
          <div className="flex-1 max-w-2xl px-2 hidden md:flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSearchResults(searchQuery.length > 0)}
              />

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults && (
                <div
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto z-50"
                >
                  {isSearchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Searching...
                    </div>
                  ) : searchResults.data?.questions?.length > 0 ? (
                    <>
                      {searchResults.data.questions.map(
                        (question: Question) => (
                          <div
                            key={question.id}
                            className="p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                            onClick={() =>
                              router.push(`/questions/${question.id}`)
                            }
                          >
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {question.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {question.content}
                            </div>
                            {question.tags && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {question.tags
                                  .slice(0, 3)
                                  .map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        )
                      )}
                      <div className="p-2 border-t bg-gray-50">
                        <button
                          onClick={performSearch}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          See all results
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-orange-500"
              >
                <Filter className="h-4 w-4 mr-1" />
                Sort
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {showSortDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={`${option.value}-${option.order}`}
                      onClick={() =>
                        handleSortChange(option.value, option.order)
                      }
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        sortBy === option.value && sortOrder === option.order
                          ? "bg-orange-50 text-orange-700"
                          : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Dropdown */}
            <div className="relative" ref={tagsDropdownRef}>
              <button
                onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-orange-500"
              >
                <Tag className="h-4 w-4 mr-1" />
                Tags
                {selectedTags.length > 0 && (
                  <span className="ml-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    {selectedTags.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {showTagsDropdown && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto z-50">
                  <div className="p-2 border-b">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Filter by tags
                    </div>
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {selectedTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                          >
                            {tag}
                            <button
                              onClick={() => handleTagToggle(tag)}
                              className="ml-1 hover:text-orange-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isTagsLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading tags...
                    </div>
                  ) : tagsData?.data?.length > 0 ? (
                    <div className="p-2">
                      {tagsData.data.map((tag: Tag) => (
                        <button
                          key={tag.id || tag.name}
                          onClick={() => handleTagToggle(tag.name)}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between ${
                            selectedTags.includes(tag.name)
                              ? "bg-orange-50 text-orange-700"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{tag.name}</span>
                          {tag.count && (
                            <span className="text-xs text-gray-500">
                              {tag.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No tags available
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {(searchQuery ||
              selectedTags.length > 0 ||
              sortBy !== "created_at" ||
              sortOrder !== "desc") && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Login / Sign up / User Actions */}
          {!isLoggedIn ? (
            <div className="hidden md:flex items-center space-x-2">
              <a
                href="/login"
                className="px-3 py-2 text-sm border border-blue-500 rounded text-blue-500 hover:bg-blue-50"
              >
                Log in
              </a>
              <a
                href="/register/user"
                className="px-3 py-2 text-sm bg-blue-500 rounded text-white hover:bg-blue-600"
              >
                Sign up
              </a>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              {/* Notifications Bell */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={toggleNotifications}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[32rem] overflow-hidden z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Notifications
                          </h3>
                          {notifications?.data?.some((n: Notification) => !n.is_read) && (
                            <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                              {
                                notifications.data.filter((n: Notification) => !n.is_read)
                                  .length
                              }
                            </span>
                          )}
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await instance.put(
                                "/question/notifications/read/all"
                              );
                              refetchNotifications();
                            } catch (error) {
                              console.error(
                                "Error marking all notifications as read:",
                                error
                              );
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                        >
                          Mark all read
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto">
                      {isNotificationsLoading ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                          <p className="text-gray-500">
                            Loading notifications...
                          </p>
                        </div>
                      ) : notifications?.data?.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {notifications.data.map(
                            (notification: Notification) => {
                              const notificationIcon = getNotificationIcon(
                                notification.notification_type
                              );
                              const notificationColor = getNotificationColor(
                                notification.notification_type
                              );

                              return (
                                <div
                                  key={notification.id}
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                                    !notification.is_read ? "bg-blue-50/50" : ""
                                  }`}
                                >
                                  <div className="flex items-start space-x-3">
                                    {/* Icon */}
                                    <div
                                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notificationColor.bg}`}
                                    >
                                      {notificationIcon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900 mb-1">
                                            {getNotificationTitle(
                                              notification.notification_type
                                            )}
                                          </p>
                                          <p className="text-sm text-gray-600 leading-relaxed">
                                            {notification.content}
                                          </p>
                                          <p className="text-xs text-gray-400 mt-2">
                                            {formatNotificationTime(
                                              notification.created_at
                                            )}
                                          </p>
                                        </div>

                                        {/* Unread indicator */}
                                        {!notification.is_read && (
                                          <div className="flex-shrink-0 ml-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            All caught up!
                          </h3>
                          <p className="text-gray-500">
                            No new notifications at the moment.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {notifications?.data?.length > 0 && (
                      <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={() => router.push("/notifications")}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <AvatarWithFallback />
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {/* Mobile Notifications (Only show when logged in) */}
            {isLoggedIn && (
              <div className="relative mr-2">
                <button
                  onClick={toggleNotifications}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile Search */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>

            {/* Mobile Controls */}
            <div className="flex space-x-2 mb-3">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-");
                  handleSortChange(newSortBy, newSortOrder);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500"
              >
                {sortOptions.map((option) => (
                  <option
                    key={`${option.value}-${option.order}`}
                    value={`${option.value}-${option.order}`}
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={performSearch}
                className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600"
              >
                Search
              </button>
            </div>

            {/* Mobile Tags */}
            {selectedTags.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                    >
                      {tag}
                      <button
                        onClick={() => handleTagToggle(tag)}
                        className="ml-1 hover:text-orange-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Notifications */}
            {isLoggedIn && showNotifications && (
              <div className="mb-3 bg-white border border-gray-200 rounded-md shadow-sm">
                <div className="p-3 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-700">
                    Notifications
                  </div>
                </div>

                {isNotificationsLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading notifications...
                  </div>
                ) : notifications?.data?.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.data.map((notification: Notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                          !notification.is_read ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {notification.notification_type}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {notification.content}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatNotificationTime(notification.created_at)}
                            </div>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No notifications
                  </div>
                )}
              </div>
            )}

            {/* Navigation Links */}
            <a
              href="/discussion"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Discussion
            </a>

            {/* Mobile Auth Buttons */}
            {!isLoggedIn ? (
              <div className="pt-4 flex space-x-2">
                <a
                  href="/login/user"
                  className="flex-1 px-3 py-2 text-sm text-center border border-blue-500 rounded text-blue-500 hover:bg-blue-50"
                >
                  Log in
                </a>
                <a
                  href="/register"
                  className="flex-1 px-3 py-2 text-sm text-center bg-blue-500 rounded text-white hover:bg-blue-600"
                >
                  Sign up
                </a>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200">
                <MobileAvatar />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
