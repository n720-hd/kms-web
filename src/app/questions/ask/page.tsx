'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, ChevronDown, Check, Calendar, Search, Tag } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { PersonalCollaborator, DivisionCollaborator } from '@/Components/create-question/types';
import { Tags } from '@/Components/create-question/types';
import * as Yup from 'yup';
import instance from '@/utils/axiosInstance';
import { toast } from 'react-toastify';



// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  content: Yup.string().required('Content is required'),
  due_date: Yup.string()
    .test('is-future-date', 'Due date cannot be in the past', function(value) {
      if (!value) return true; // Optional field
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for date comparison
      return selectedDate >= today;
    }),
  collaborator_type: Yup.string().oneOf(['NONE', 'PERSONAL', 'DIVISION'], 'Invalid collaborator type'),
  collaborator_id: Yup.string().when('collaborator_type', {
    is: 'PERSONAL',
    then: (schema) => schema.required('User is required'),
    otherwise: (schema) => schema
  }),
  collaborator_division_id: Yup.string().when('collaborator_type', {
    is: 'DIVISION',
    then: (schema) => schema.required('Division is required'),
    otherwise: (schema) => schema
  }),
  tag_ids: Yup.array().of(Yup.number()).max(5, 'Maximum 5 tags allowed')
});

const QuestionCreatePage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isPersonalDropdownOpen, setIsPersonalDropdownOpen] = useState(false);
  const [personalSearchQuery, setPersonalSearchQuery] = useState('');
  const [isDivisionDropdownOpen, setIsDivisionDropdownOpen] = useState(false);
  const [divisionSearchQuery, setDivisionSearchQuery] = useState('');

  const initialValues = {
    title: '',
    content: '',
    due_date: '',
    collaborator_type: 'NONE' as 'NONE' | 'PERSONAL' | 'DIVISION',
    collaborator_id: '',
    collaborator_division_id: '',
    tag_ids: [] as number[],
    attachments: [] as File[]
  };

  // Fetch tags
  const { data: tags = [], isLoading: tagsLoading } = useQuery<Tags[]>({
    queryKey: ['question-tags'],
    queryFn: async () => {
      const response = await instance.get('/question/tags');
      return response.data.data;
    }
  });

  // Fetch personal collaborators
  const { data: personalCollaborators = [] } = useQuery<PersonalCollaborator[]>({
    queryKey: ['personal-collaborators'],
    queryFn: async () => {
      const response = await instance.get('/question/collaborators/personal');
      return response.data.data;
    },
    enabled: true
  });

  // Fetch division collaborators
  const { data: divisionCollaborators = [] } = useQuery<DivisionCollaborator[]>({
    queryKey: ['division-collaborators'],
    queryFn: async () => {
      const response = await instance.get('/question/collaborators/division');
      return response.data.data;
    },
    enabled: true
  });

  console.log('div:',divisionCollaborators)

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery.trim()) return tags;
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );
  }, [tags, tagSearchQuery]);

  // Filter personal collaborators based on search query
  const filteredPersonalCollaborators = useMemo(() => {
    if (!personalSearchQuery.trim()) return personalCollaborators;
    return personalCollaborators.filter(user => 
      user.username.toLowerCase().includes(personalSearchQuery.toLowerCase())
    );
  }, [personalCollaborators, personalSearchQuery]);

  // Filter division collaborators based on search query
  const filteredDivisionCollaborators = useMemo(() => {
    if (!divisionSearchQuery.trim()) return divisionCollaborators;
    return divisionCollaborators.filter(division => 
      division.division_name.toLowerCase().includes(divisionSearchQuery.toLowerCase())
    );
  }, [divisionCollaborators, divisionSearchQuery]);

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.warning('Tag name cannot be empty');
      return;
    }
    
    try {
      setIsCreatingTag(true);
      await instance.post('/question/tags', { tagName: newTagName.trim() });
      
      // Refresh tags
      await queryClient.refetchQueries({ queryKey: ['question-tags'] });
      
      toast.success('Tag created successfully!');
      setNewTagName('');
    } catch (error) {
      toast.error('Failed to create tag');
      console.error('Error creating tag:', error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  // Mutation for creating question
  const createQuestionMutation = useMutation({
    mutationFn: async (values: typeof initialValues) => {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', values.content);
      formData.append('due_date', values.due_date);
      formData.append('collaborator_type', values.collaborator_type);
      
      if (values.collaborator_type === 'PERSONAL') {
        formData.append('collaborator_id', values.collaborator_id);
      } else if (values.collaborator_type === 'DIVISION') {
        formData.append('collaborator_division_id', values.collaborator_division_id);
      }
      
      formData.append('tag_ids', JSON.stringify(values.tag_ids));
      
      values.attachments.forEach(file => {
        formData.append('attachments', file);
      });
      
      const response = await instance.post('/question', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Question created successfully!');
      router.push(`/questions/${data.data.question_id}`);
    },
    onError: (error: any) => {
      console.error('Error creating question:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create question';
      toast.error(errorMessage);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Ask a New Question</h1>
            <p className="text-gray-600 mt-1">
              Share your knowledge and get answers from the community
            </p>
          </div>
          
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            validateOnMount={true}
            onSubmit={(values) => {
              createQuestionMutation.mutate(values);
            }}
          >
            {({ values, setFieldValue, touched, errors, isValid }) => {
              // Define helper functions inside Formik render to access setFieldValue
              const handleTagSelect = (tagId: number) => {
                const newTags = values.tag_ids.includes(tagId)
                  ? values.tag_ids.filter(id => id !== tagId)
                  : [...values.tag_ids, tagId];
                setFieldValue('tag_ids', newTags);
              };

              const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  const updatedFiles = [...values.attachments, ...newFiles];
                  setFieldValue('attachments', updatedFiles);
                }
              };

              const removeFile = (index: number) => {
                const updatedFiles = values.attachments.filter((_, i) => i !== index);
                setFieldValue('attachments', updatedFiles);
              };

              // Close tag dropdown when clicking outside
              React.useEffect(() => {
                const handleClickOutside = (event: MouseEvent) => {
                  const target = event.target as HTMLElement;
                  if (!target.closest('.tag-dropdown-container')) {
                    setIsTagDropdownOpen(false);
                  }
                };

                if (isTagDropdownOpen) {
                  document.addEventListener('mousedown', handleClickOutside);
                  return () => {
                    document.removeEventListener('mousedown', handleClickOutside);
                  };
                }
              }, [isTagDropdownOpen]);

              return (
                <Form className="p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Question Title
                    </label>
                    <Field
                      type="text"
                      name="title"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        touched.title && errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="What's your question?"
                    />
                    <ErrorMessage name="title" component="p" className="mt-1 text-sm text-red-500" />
                    <p className="mt-1 text-sm text-gray-500">
                      Be specific and imagine you're asking a question to another person
                    </p>
                  </div>
                  
                  {/* Content */}
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                      Detailed Explanation
                    </label>
                    <Field
                      as="textarea"
                      name="content"
                      rows={6}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        touched.content && errors.content ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Include all the information someone would need to answer your question"
                    />
                    <ErrorMessage name="content" component="p" className="mt-1 text-sm text-red-500" />
                  </div>
                  
                  {/* Due Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date (Optional)
                      </label>
                      <div className="relative">
                        <Field
                          type="date"
                          name="due_date"
                          min={getTodayDate()}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            touched.due_date && errors.due_date ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      <ErrorMessage name="due_date" component="p" className="mt-1 text-sm text-red-500" />
                    </div>
                    
                    {/* Collaborator Type */}
                    <div>
                      <label htmlFor="collaborator_type" className="block text-sm font-medium text-gray-700 mb-1">
                        Collaborator Type
                      </label>
                      <Field
                        as="select"
                        name="collaborator_type"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="NONE">Open Question</option>
                        <option value="PERSONAL">User</option>
                        <option value="DIVISION">Division</option>
                      </Field>
                    </div>
                  </div>
                  
                  {/* Collaborator Selection */}
                  {values.collaborator_type === 'PERSONAL' && (
                    <div className="relative">
                      <label htmlFor="collaborator_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Select User
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsPersonalDropdownOpen(!isPersonalDropdownOpen)}
                          className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            touched.collaborator_id && errors.collaborator_id ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <span className={values.collaborator_id ? 'text-gray-900' : 'text-gray-400'}>
                            {values.collaborator_id 
                              ? personalCollaborators?.find(user => user.id.toString() === values.collaborator_id)?.username || 'Select a user'
                              : 'Select a user'
                            }
                          </span>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isPersonalDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isPersonalDropdownOpen && (
                          <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl">
                            {/* Search Input */}
                            <div className="p-3 border-b border-gray-200">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={personalSearchQuery}
                                  onChange={(e) => setPersonalSearchQuery(e.target.value)}
                                  placeholder="Search users..."
                                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            
                            {/* Users List */}
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {filteredPersonalCollaborators?.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                  {personalSearchQuery ? `No users found for "${personalSearchQuery}"` : 'No users available'}
                                </div>
                              ) : (
                                <div>
                                  <div 
                                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-50 ${
                                      !values.collaborator_id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                    }`}
                                    onClick={() => {
                                      setFieldValue('collaborator_id', '');
                                      setIsPersonalDropdownOpen(false);
                                    }}
                                  >
                                    <span className="text-sm font-medium">No user selected</span>
                                    {!values.collaborator_id && (
                                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  {filteredPersonalCollaborators?.map((user) => (
                                    <div 
                                      key={user.id}
                                      className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-50 last:border-b-0 ${
                                        values.collaborator_id === user.id.toString() 
                                          ? 'bg-blue-50 text-blue-900' 
                                          : 'text-gray-900'
                                      }`}
                                      onClick={() => {
                                        setFieldValue('collaborator_id', user.id.toString());
                                        setIsPersonalDropdownOpen(false);
                                      }}
                                    >
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                          {user.username[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium">{user.username}</span>
                                      </div>
                                      {values.collaborator_id === user.id.toString() && (
                                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <ErrorMessage name="collaborator_id" component="p" className="mt-1 text-sm text-red-500" />
                    </div>
                  )}
                  
                  {values.collaborator_type === 'DIVISION' && (
                    <div className="relative">
                      <label htmlFor="collaborator_division_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Division
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDivisionDropdownOpen(!isDivisionDropdownOpen)}
                          className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            touched.collaborator_division_id && errors.collaborator_division_id ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <span className={values.collaborator_division_id ? 'text-gray-900' : 'text-gray-400'}>
                            {values.collaborator_division_id 
                              ? divisionCollaborators?.find(division => division.id.toString() === values.collaborator_division_id)?.division_name || 'Select a division'
                              : 'Select a division'
                            }
                          </span>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDivisionDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isDivisionDropdownOpen && (
                          <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl">
                            {/* Search Input */}
                            <div className="p-3 border-b border-gray-200">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={divisionSearchQuery}
                                  onChange={(e) => setDivisionSearchQuery(e.target.value)}
                                  placeholder="Search divisions..."
                                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            
                            {/* Divisions List */}
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {filteredDivisionCollaborators?.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                  {divisionSearchQuery ? `No divisions found for "${divisionSearchQuery}"` : 'No divisions available'}
                                </div>
                              ) : (
                                <div>
                                  <div 
                                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-50 ${
                                      !values.collaborator_division_id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                    }`}
                                    onClick={() => {
                                      setFieldValue('collaborator_division_id', '');
                                      setIsDivisionDropdownOpen(false);
                                    }}
                                  >
                                    <span className="text-sm font-medium">No division selected</span>
                                    {!values.collaborator_division_id && (
                                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  {filteredDivisionCollaborators?.map((division) => (
                                    <div 
                                      key={division.id}
                                      className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-50 last:border-b-0 ${
                                        values.collaborator_division_id === division.id.toString() 
                                          ? 'bg-blue-50 text-blue-900' 
                                          : 'text-gray-900'
                                      }`}
                                      onClick={() => {
                                        setFieldValue('collaborator_division_id', division.id.toString());
                                        setIsDivisionDropdownOpen(false);
                                      }}
                                    >
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                          {division.division_name[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium">{division.division_name}</span>
                                      </div>
                                      {values.collaborator_division_id === division.id.toString() && (
                                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <ErrorMessage name="collaborator_division_id" component="p" className="mt-1 text-sm text-red-500" />
                    </div>
                  )}
                  
                  {/* Enhanced Tags Section */}
                  <div className="relative tag-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <div className="flex items-center flex-wrap gap-2 min-h-[20px]">
                          {values.tag_ids.length === 0 ? (
                            <span className="text-gray-400">Select tags...</span>
                          ) : (
                            values.tag_ids.map(tagId => {
                              const tag = tags?.find(t => t.tag_id === tagId);
                              return tag ? (
                                <span 
                                  key={tag.tag_id} 
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center"
                                >
                                  {tag.name}
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTagSelect(tag.tag_id);
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </span>
                                </span>
                              ) : null;
                            })
                          )}
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Fixed positioned dropdown with proper z-index */}
                      {isTagDropdownOpen && (
                        <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl" style={{ maxHeight: 'none' }}>
                          {/* Search Input */}
                          <div className="p-3 border-b border-gray-200">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={tagSearchQuery}
                                onChange={(e) => setTagSearchQuery(e.target.value)}
                                placeholder="Search tags..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>

                          {/* Create New Tag */}
                          <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <div className="flex">
                              <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Create new tag..."
                                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateTag();
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="button"
                                onClick={handleCreateTag}
                                disabled={isCreatingTag || !newTagName.trim()}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-r-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isCreatingTag ? 'Creating...' : 'Add'}
                              </button>
                            </div>
                          </div>
                          
                          {/* Tags List - Show all tags */}
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {tagsLoading ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                Loading tags...
                              </div>
                            ) : filteredTags?.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                {tagSearchQuery ? `No tags found for "${tagSearchQuery}"` : 'No tags available'}
                              </div>
                            ) : (
                              <div>
                                {filteredTags?.map((tag, index) => (
                                  <div 
                                    key={`tag-${tag.tag_id}`}
                                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-50 last:border-b-0 ${
                                      values.tag_ids.includes(tag.tag_id) 
                                        ? 'bg-blue-50 text-blue-900' 
                                        : 'text-gray-900'
                                    }`}
                                    onClick={() => handleTagSelect(tag.tag_id)}
                                  >
                                    <div className="flex items-center">
                                      <Tag className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                                      <span className="text-sm font-medium">{tag.name}</span>
                                    </div>
                                    {values.tag_ids.includes(tag.tag_id) && (
                                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Footer with count */}
                          {filteredTags.length > 0 && (
                            <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50 border-t rounded-b-lg">
                              {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''} available
                              {values.tag_ids.length > 0 && ` • ${values.tag_ids.length} selected`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <ErrorMessage name="tag_ids" component="p" className="mt-1 text-sm text-red-500" />
                    <p className="mt-1 text-sm text-gray-500">
                      Add up to 5 tags to describe what your question is about ({values.tag_ids.length}/5)
                    </p>
                  </div>
                  
                  {/* Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attachments
                    </label>
                    <div className="flex items-center">
                      <label 
                        htmlFor="file-upload"
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        <span>Add files</span>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      />
                      <span className="ml-3 text-sm text-gray-500">
                        {values.attachments.length > 0 
                          ? `${values.attachments.length} file(s) selected` 
                          : 'No files selected'}
                      </span>
                    </div>
                    
                    {values.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {values.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                              <span className="ml-2 text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-gray-500 hover:text-gray-700 cursor-pointer p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Submit Button */}
                  <div className="pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={createQuestionMutation.isPending || !isValid}
                      className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${
                        createQuestionMutation.isPending || !isValid ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {createQuestionMutation.isPending ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Question...
                        </span>
                      ) : (
                        'Post Your Question'
                      )}
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
        
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">How to ask a good question</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                <Check className="h-5 w-5" />
              </div>
              <p className="ml-3 text-gray-700">
                <span className="font-medium">Summarize the problem</span> - Include details about your goal and what you've tried
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                <Check className="h-5 w-5" />
              </div>
              <p className="ml-3 text-gray-700">
                <span className="font-medium">Describe what you've tried</span> - Show what you've done to solve the problem
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                <Check className="h-5 w-5" />
              </div>
              <p className="ml-3 text-gray-700">
                <span className="font-medium">Add relevant tags</span> - Helps your question reach the right people
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                <Check className="h-5 w-5" />
              </div>
              <p className="ml-3 text-gray-700">
                <span className="font-medium">Review your question</span> - Make sure it's clear and includes all necessary details
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuestionCreatePage;