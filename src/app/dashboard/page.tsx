"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/utils/axiosInstance";
import {
  Users,
  MessageSquare,
  HelpCircle,
  Building2,
  Activity,
  Settings,
  Eye,
} from "lucide-react";
import StatCard from "@/Components/dashboard/StatCard";
import OverviewTab from "@/Components/dashboard/tabs/OverviewTab";
import UsersTab from "@/Components/dashboard/tabs/UsersTab";
import QuestionsTab from "@/Components/dashboard/tabs/QuestionsTab";
import DivisionsTab from "@/Components/dashboard/tabs/DivisionsTab";
import SettingsTab from "@/Components/dashboard/tabs/SettingsTab";
import ArchiveTabs from "@/Components/dashboard/tabs/ArchiveTabs";
import { DashboardStats, RecentUsers } from "@/Components/dashboard/types";
import { toast } from "react-toastify";
import AnswerTabs from "@/Components/dashboard/tabs/AnswersTabs";

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionStatus, setQuestionStatus] = useState<string | null>(null);
  const [answersPage, setAnswersPage] = useState(1);
  const [answersSearch, setAnswersSearch] = useState("");
  const [answersFilter, setAnswersFilter] = useState<
    "newest" | "oldest" | "pending" | null
  >(null);
  const queryClient = useQueryClient();

  // Fetch dashboard stats with questions
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["admin-stats", questionsPage, questionStatus],
    queryFn: async () => {
      const response = await instance.get("/admin/dashboard/statistics", {
        params: {
          questionsPage,
          questionsLimit: 10,
          questionStatus,
        },
      });
      return response.data.data as DashboardStats;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch archived questions
  const { data: archivedQuestions, isLoading: archivedQuestionsLoading } =
    useQuery({
      queryKey: ["admin-archived-questions"],
      queryFn: async () => {
        const response = await instance.get("/admin/questions/archive");
        return response.data.data;
      },
      retry: 1,
      staleTime: 5 * 60 * 1000,
    });

  // Fetch all users
  const { data: users, isLoading: userListLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await instance.get("/admin/users");
      return response.data.data;
    },
  });

  // Fetch recent users
  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const response = await instance.get("/admin/users/recent");
      return response.data.data as RecentUsers[];
    },
  });

  // Fetch maintenance mode status
  const {
    data: maintenanceModeStatus,
    isLoading: maintenanceModeStatusLoading,
  } = useQuery({
    queryKey: ["admin-maintenance-mode-status"],
    queryFn: async () => {
      const response = await instance.get("/admin/maintenance");
      return response.data.data;
    },
  });

  // Fetch recent questions (for overview tab)
  const { data: recentQuestions, isLoading: recentQuestionsLoading } = useQuery(
    {
      queryKey: ["admin-recent-questions"],
      queryFn: async () => {
        const response = await instance.get("/admin/questions/recent");
        return response.data.data;
      },
    }
  );

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const response = await instance.get("/admin/roles");
      return response.data.data;
    },
  });

  // Fetch all answers
  const {
    data: answersData,
    isLoading: answersLoading,
    refetch: refetchAnswers,
  } = useQuery({
    queryKey: ["admin-answers", answersPage, answersSearch, answersFilter],
    queryFn: async () => {
      const params: any = {
        page: answersPage,
        limit: 10,
      };

      if (answersSearch.trim()) {
        params.search = answersSearch;
      }

      if (answersFilter) {
        params.filter = answersFilter;
      }

      const response = await instance.get("/admin/answers", { params });
      return response.data;
    },
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });

  //mutation to set user role
  const { mutate: setUserRole, isPending } = useMutation({
    mutationFn: async ({
      user_id,
      role_id,
    }: {
      user_id: number;
      role_id: number;
    }) => {
      return await instance.patch("/admin/role", {
        user_id,
        role_id,
      });
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-users"] });
    },
    onError: (error: any) => {
      toast.error(error.response.data.msg || "Something went wrong");
    },
  });

  //mutation to set user division
  const { mutate: setUserDivision, isPending: setDivisionPending } =
    useMutation({
      mutationFn: async ({
        user_id,
        division_id,
      }: {
        user_id: number;
        division_id: number;
      }) => {
        return await instance.patch("/admin/division", {
          user_id,
          division_id,
        });
      },
      onSuccess: (res) => {
        toast.success(res.data.message);
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        queryClient.invalidateQueries({ queryKey: ["admin-recent-users"] });
      },
      onError: (error: any) => {
        toast.error(error.response.data.msg || "Something went wrong");
      },
    });

  //mutation to approve or reject a answer
  const { mutate: approveAnswer, isPending: approvingAnswer } = useMutation({
    mutationFn: async (answerId: number) => {
      const response = await instance.post("/admin/answer/approve", {
        answer_id: answerId,
      });
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Answer approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-answers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-questions"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.msg || "Failed to approve answer");
    },
  });

  //mutation to set maintenance mode
  const { mutate: setMaintenanceMode, isPending: setMaintenancePending } =
    useMutation({
      mutationFn: async (maintenanceMode: boolean) => {
        const response = await instance.post("/admin/maintenance", {
          maintenanceMode,
        });
        return response.data;
      },
      onSuccess: (res) => {
        toast.success("Maintenance mode updated successfully");
        queryClient.invalidateQueries({
          queryKey: ["admin-maintenance-mode-status"],
        });
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.msg || "Failed to update maintenance mode"
        );
      },
    });

  // mutation to takedown a question
  const { mutate: takeDownQuestion } = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await instance.post("/admin/takedown", {
        questionId,
      });
      return response.data.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Action completed successfully");
      // Refetch both active and archived questions since it's a toggle
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-archived-questions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-questions"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.msg || "Action failed");
    },
  });

  // mutation to create a new division
  const { mutate: createDivision, isPending: creatingDivision } = useMutation({
    mutationFn: async (divisionName: string) => {
      const response = await instance.post("/admin/division", { divisionName });
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Division created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.msg || "Failed to create division");
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle questions filter change
  const handleQuestionFilterChange = (status: string | null) => {
    setQuestionStatus(status);
    setQuestionsPage(1); // Reset to first page
  };

  // Handle questions page change
  const handleQuestionPageChange = (page: number) => {
    setQuestionsPage(page);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "questions", label: "Questions", icon: HelpCircle },
    { id: "answers", label: "Answers", icon: MessageSquare },
    { id: "archive", label: "Archive", icon: Eye },
    { id: "divisions", label: "Divisions", icon: Building2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error handling
  if (statsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600">
            Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log("Stats data:", stats);
  console.log("Questions from stats:", stats?.questions);

  const handleAnswerSearch = (search: string) => {
    setAnswersSearch(search);
    setAnswersPage(1); // Reset to first page
  };

  const handleAnswerFilter = (
    filter: "newest" | "oldest" | "pending" | null
  ) => {
    setAnswersFilter(filter);
    setAnswersPage(1); // Reset to first page
  };

  const handleAnswerPageChange = (page: number) => {
    setAnswersPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers}
            icon={Users}
            color="bg-blue-500"
            trend={`+${stats?.recentActivity?.newUsers || 0} this week`}
          />
          <StatCard
            title="Questions"
            value={stats?.totalQuestions}
            icon={HelpCircle}
            color="bg-green-500"
            trend={`+${stats?.recentActivity?.newQuestions || 0} this week`}
          />
          <StatCard
            title="Answers"
            value={stats?.totalAnswers}
            icon={MessageSquare}
            color="bg-purple-500"
            trend={`+${stats?.recentActivity?.newAnswers || 0} this week`}
          />
          <StatCard
            title="Divisions"
            value={stats?.totalDivisions}
            icon={Building2}
            color="bg-orange-500"
          />
        </div>

        {/* Additional Stats Cards for Question Status */}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <OverviewTab
                stats={stats}
                recentUsers={recentUsers}
                recentQuestions={recentQuestions}
                usersLoading={usersLoading}
                questionsLoading={recentQuestionsLoading}
                formatDate={formatDate}
              />
            )}

            {activeTab === "users" && (
              <UsersTab
                users={users}
                formatDate={formatDate}
                divisions={stats?.divisions}
                roles={roles}
                setUserRole={setUserRole}
                setUserDivision={setUserDivision}
                isPending={isPending}
                setDivisionPending={setDivisionPending}
              />
            )}

            {activeTab === "questions" && (
              <QuestionsTab
                stats={stats}
                questionsData={stats!.questions}
                formatDate={formatDate}
                takedownQuestion={takeDownQuestion}
                onFilterChange={handleQuestionFilterChange}
                onPageChange={handleQuestionPageChange}
                currentFilter={questionStatus}
                isLoading={statsLoading}
              />
            )}

            {activeTab === "answers" && (
              <AnswerTabs
                answersData={answersData}
                isLoading={answersLoading}
                onSearch={handleAnswerSearch}
                onFilter={handleAnswerFilter}
                onPageChange={handleAnswerPageChange}
                onApprove={approveAnswer}
                currentPage={answersPage}
                currentSearch={answersSearch}
                currentFilter={answersFilter}
                formatDate={formatDate}
                isApproving={approvingAnswer}
              />
            )}

            {activeTab === "archive" && (
              <ArchiveTabs
                takedownQuestion={takeDownQuestion}
                archivedQuestions={archivedQuestions}
                formatDate={formatDate}
              />
            )}

            {activeTab === "divisions" && (
              <DivisionsTab
                divisions={stats?.divisions}
                onCreateDivision={createDivision}
                isCreating={creatingDivision}
              />
            )}

            {activeTab === "settings" && (
              <SettingsTab
                setMaintenanceMode={setMaintenanceMode}
                setMaintenancePending={setMaintenancePending}
                maintenanceModeStatus={maintenanceModeStatus}
                maintenanceModeStatusLoading={maintenanceModeStatusLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
