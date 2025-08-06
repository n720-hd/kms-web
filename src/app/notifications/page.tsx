// Improved Notifications Page Component
"use client";
import React, { useState } from 'react';
import { 
  Bell, 
  Filter, 
  CheckCircle, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  HelpCircle,
  MessageCircle,
  ThumbsUp,
  ChevronDown,
  Search,
  MoreHorizontal
} from 'lucide-react';
import instance from '@/utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import { getNotificationTitle, getNotificationIcon, getNotificationColor, formatNotificationTime } from '@/utils/notificationHelper';
import { useRouter } from 'next/navigation';

const NotificationsPage = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  
   const {
    data: notifications,
    isLoading: isNotificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      
      const res = await instance.get("/question/notifications");
      return res.data;
    },
    
    refetchInterval: 60000, // Refetch every minute
  });

  const handleNotificationClick = async (notification: any) => {
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


  const filterOptions = [
    { value: 'all', label: 'All Notifications', count: notifications?.data?.length || 0 },
    { value: 'unread', label: 'Unread', count: notifications?.data?.filter((n: any) => !n.is_read).length || 0 },
    { value: 'ANSWER_ACCEPTED', label: 'Answer Accepted', count: 0 },
    { value: 'ANSWER_SUBMITTED', label: 'New Answers', count: 0 },
    { value: 'QUESTION_ASSIGNED', label: 'Assignments', count: 0 },
    { value: 'LIKE', label: 'Likes', count: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-500">Stay updated with your latest activities</p>
              </div>
            </div>
            
            <button
              onClick={async () => {
                try {
                  await instance.put("/question/notifications/read/all");
                  refetchNotifications();
                } catch (error) {
                  console.error("Error marking all notifications as read:", error);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Mark all as read
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Filter className="w-4 h-4 mr-2" />
                {filterOptions.find(f => f.value === selectedFilter)?.label || 'All Notifications'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedFilter(option.value);
                          setShowFilterDropdown(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span>{option.label}</span>
                        {option.count > 0 && (
                          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                            {option.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isNotificationsLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications?.data?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.data
                .filter((notification: any) => {
                  if (selectedFilter === 'all') return true;
                  if (selectedFilter === 'unread') return !notification.is_read;
                  return notification.notification_type === selectedFilter;
                })
                .filter((notification: any) => 
                  searchTerm === '' || 
                  notification.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  getNotificationTitle(notification.notification_type).toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((notification: any) => {
                  const notificationIcon = getNotificationIcon(notification.notification_type);
                  const notificationColor = getNotificationColor(notification.notification_type);
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                        !notification.is_read ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${notificationColor.bg}`}>
                          {notificationIcon}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-base font-semibold text-gray-900">
                                  {getNotificationTitle(notification.notification_type)}
                                </h3>
                                {!notification.is_read && (
                                  <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 leading-relaxed mb-2">
                                {notification.content}
                              </p>
                              <p className="text-sm text-gray-400">
                                {formatNotificationTime(notification.created_at)}
                              </p>
                            </div>
                            
                            {/* Action Menu */}
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                You're all up to date. New notifications will appear here when you receive them.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;