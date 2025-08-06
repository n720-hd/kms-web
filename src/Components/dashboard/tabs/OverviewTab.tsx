import { OverviewTabProps } from "../types";

const OverviewTab = ({ stats,
  recentUsers,
  recentQuestions,
  usersLoading,
  questionsLoading,
  formatDate
}: OverviewTabProps) => {
    return(
        <div className="space-y-8">
                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Users */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {usersLoading ? (
                        <div className="animate-pulse space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                          ))}
                        </div>
                      ) : (
                        recentUsers?.map((user) => (
                          <div key={user.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.first_name[0]}{user.last_name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-gray-500">@{user.username}</p>
                                <p className="text-xs text-gray-400">
                                  {user.division?.division_name || 'No division'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role.name === 'admin' 
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role.name}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(user.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Questions */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Questions</h3>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {questionsLoading ? (
                        <div className="animate-pulse space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                          ))}
                        </div>
                      ) : (
                        recentQuestions?.map((question) => (
                          <div key={question.question_id} className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                              {question.title}
                            </h4>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>by @{question.creator.username}</span>
                              <div className="flex items-center space-x-4">
                                <span>{question._count.answers} answers</span>
                                <span>{question._count.comments} comments</span>
                                <span>{formatDate(question.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
    )
}

export default OverviewTab;