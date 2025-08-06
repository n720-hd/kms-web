import { RotateCcw, Calendar, User, FileText, X } from "lucide-react";
import { useState } from "react";

interface Creator {
  user_id: number;
  username: string;
  profile_picture?: string;
}

interface ArchivedQuestion {
  question_id: number;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  due_date: string;
  collaborator_type: string;
  creator: Creator;
  deleted_at: string;
}

interface ArchiveTabsProps {
  takedownQuestion: (questionId: number) => void;
  archivedQuestions: ArchivedQuestion[];
  formatDate: (dateString: string) => string;
}

const ArchiveTabs = ({
  takedownQuestion, 
  archivedQuestions, 
  formatDate
}: ArchiveTabsProps) => {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{id: number, title: string} | null>(null);

  const handleRestoreClick = (questionId: number, questionTitle: string) => {
    setSelectedQuestion({id: questionId, title: questionTitle});
    setShowRestoreDialog(true);
  };

  const handleConfirmRestore = () => {
    if (selectedQuestion) {
      takedownQuestion(selectedQuestion.id); // Use the same toggle function
      setShowRestoreDialog(false);
      setSelectedQuestion(null);
    }
  };

  const handleCancelRestore = () => {
    setShowRestoreDialog(false);
    setSelectedQuestion(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Archived Questions</h3>
          <p className="text-sm text-gray-500 mt-1">
            Questions that have been taken down ({archivedQuestions?.length || 0} total)
          </p>
        </div>
      </div>
      
      {!archivedQuestions || archivedQuestions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No archived questions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Questions that are taken down will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {archivedQuestions.map((question) => (
            <div key={question.question_id} className="bg-white border border-red-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {question.title}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Archived
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {question.content}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>by @{question.creator.username}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(question.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Archived: {formatDate(question.deleted_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {question.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button 
                    onClick={() => handleRestoreClick(question.question_id, question.title)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    title="Restore Question"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Restore</h3>
              <button 
                onClick={handleCancelRestore}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Are you sure you want to restore this question?
                  </h4>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="text-sm text-gray-700 font-medium">Question:</p>
                <p className="text-sm text-gray-600 mt-1">"{selectedQuestion?.title}"</p>
              </div>
              
              <p className="text-sm text-gray-500">
                This will make the question visible to users again.
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCancelRestore}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Restore Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveTabs;