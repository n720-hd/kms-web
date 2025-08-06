"use client";
import React, { useState } from 'react';
import { Plus, MoreVertical, X, Building2 } from "lucide-react";

interface Division {
  id: number;
  division_name: string;
  created_at: string;
  stats: {
    members: number;
    questions: number;
    answers: number;
  };
}

interface DivisionsTabProps {
  divisions?: Division[];
  onCreateDivision: (divisionName: string) => void;
  isCreating: boolean;
}

const DivisionsTab: React.FC<DivisionsTabProps> = ({ 
  divisions, 
  onCreateDivision, 
  isCreating 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [divisionName, setDivisionName] = useState('');
  const [formError, setFormError] = useState('');
  const [wasCreating, setWasCreating] = useState(false);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormError('');
    
    // Validate form
    if (!divisionName.trim()) {
      setFormError('Division name is required');
      return;
    }
    
    if (divisionName.trim().length < 2) {
      setFormError('Division name must be at least 2 characters long');
      return;
    }
    
    // Check for duplicate names (case-insensitive)
    const isDuplicate = divisions?.some(
      division => division.division_name.toLowerCase() === divisionName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      setFormError('A division with this name already exists');
      return;
    }
    
    // Submit the form
    onCreateDivision(divisionName.trim());
  };

  // Track when creation starts
  React.useEffect(() => {
    if (isCreating) {
      setWasCreating(true);
    }
  }, [isCreating]);

  // Handle successful creation (close modal and reset form)
  React.useEffect(() => {
    if (wasCreating && !isCreating && showCreateModal) {
      // Close modal and reset form after successful creation
      const timer = setTimeout(() => {
        setShowCreateModal(false);
        setDivisionName('');
        setFormError('');
        setWasCreating(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [wasCreating, isCreating, showCreateModal]);

  // Handle modal close
  const handleCloseModal = () => {
    if (!isCreating) {
      setShowCreateModal(false);
      setDivisionName('');
      setFormError('');
      setWasCreating(false);
    }
  };

  // Create Division Modal
  const CreateDivisionModal = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleCloseModal}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Division</h3>
          <button
            onClick={handleCloseModal}
            disabled={isCreating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="divisionName" className="block text-sm font-medium text-gray-700 mb-2">
              Division Name
            </label>
            <input
              type="text"
              id="divisionName"
              value={divisionName}
              onChange={(e) => {
                setDivisionName(e.target.value);
                setFormError(''); // Clear error when user types
              }}
              disabled={isCreating}
              placeholder="Enter division name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={100}
              autoFocus
            />
            {formError && (
              <p className="mt-1 text-sm text-red-600">{formError}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !divisionName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Division
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Division Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Organize your team into different divisions
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Division
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {divisions && divisions.length > 0 ? (
          divisions.map((division: Division) => (
            <div key={division.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {division.division_name}
                  </h4>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Members</span>
                  <span className="font-semibold text-gray-900">{division.stats.members}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Questions</span>
                  <span className="font-semibold text-gray-900">{division.stats.questions}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Answers</span>
                  <span className="font-semibold text-gray-900">{division.stats.answers}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created: {new Date(division.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Building2 className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No divisions found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Get started by creating your first division to organize your team and content.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Division
            </button>
          </div>
        )}
      </div>

      {/* Create Division Modal */}
      {showCreateModal && <CreateDivisionModal />}
    </div>
  );
};

export default DivisionsTab;