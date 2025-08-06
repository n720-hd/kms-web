// types.ts

export interface DashboardStats {
  // Basic statistics
  totalUsers: number;
  totalQuestions: number;
  totalAnswers: number;
  totalDivisions: number;
  
  // Question statistics by status
  pendingQuestions: number;
  answeredQuestions: number;
  rejectedQuestions: number;
  closedQuestions: number;
  assignedQuestions: number;
  
  // Question status distribution
  questionStatusDistribution: Array<{
    status: string;
    count: number;
  }>;
  
  // Recent activity (last 7 days)
  recentActivity: {
    newUsers: number;
    newQuestions: number;
    newAnswers: number;
  };
  
  // Divisions with detailed stats
  divisions: Division[];
  
  // All questions with pagination
  questions: QuestionsData;
}

export interface Division {
  id: number;
  division_name: string;
  created_at: string;
  stats: {
    members: number;
    questions: number;
    answers: number;
  };
}

export interface Creator {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
}

export interface Collaborator {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface Question {
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

export interface QuestionsData {
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

export interface RecentUsers {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  created_at: string;
  role: {
    role_id: number;
    name: string;
  };
  division?: {
    id: number;
    division_name: string;
  };
}

export interface RecentQuestion {
  question_id: number;
  title: string;
  content: string;
  created_at: string;
  creator: {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  _count: {
    answers: number;
    comments: number;
    likes: number;
  };
}

// Component Props Types
export interface OverviewTabProps {
  stats?: DashboardStats;
  recentUsers?: RecentUsers[];
  recentQuestions?: RecentQuestion[];
  usersLoading: boolean;
  questionsLoading: boolean;
  formatDate: (dateString: string) => string;
}

export interface UsersTabsProps {
  users?: any[];
  formatDate: (dateString: string) => string;
}

export interface QuestionsTabProps {
  questionsData: QuestionsData;
  formatDate: (dateString: string) => string;
  takedownQuestion: (questionId: number) => void;
  onFilterChange: (status: string | null) => void;
  onPageChange: (page: number) => void;
  currentFilter: string | null;
  isLoading?: boolean;
  stats?: DashboardStats;
}

export interface DivisionsTabProps {
  divisions?: Division[];
}