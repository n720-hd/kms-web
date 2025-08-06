'use client';
import { useQuery, useMutation } from "@tanstack/react-query";
import instance from "@/utils/axiosInstance"; 
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from 'yup';

interface Attachment {
  attachment_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
}

interface AnswerToBeEditedData {
  content: string;
  attachment?: Attachment[];
}

// Validation schema
const validationSchema = Yup.object({
  content: Yup.string().required('Content is required').min(10, 'Content must be at least 10 characters'),
});

const MyAnswerDataPage = ({ params }: { params: { answer_id: string } }) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState<boolean>(false);
    const router = useRouter();
    const answer_id = params.answer_id;

    const {data: answerToBeEditedData, isLoading, isError, refetch} = useQuery<AnswerToBeEditedData>({
        queryKey: ['answerToBeEdited', answer_id],
        queryFn: async () => {
            const response = await instance.get(`/answer/edit/${answer_id}`);
            return response.data.data;
        }
    });

    const {mutate: mutateEditAnswer, isPending: isEditingLoading} = useMutation({
        mutationFn: async (content: string) => {
            const formData = new FormData();
            formData.append("answer_id", answer_id);
            formData.append("content", content);
            formData.append("attachmentsToDelete", JSON.stringify(attachmentsToDelete));
            newFiles.forEach(file => {
                formData.append("attachments", file);
            });
            const response = await instance.patch('/answer/edit', formData);
            return response.data;
        },
        onSuccess: (res) => {
            toast.success(res.message || 'Answer edited successfully');
            setIsEditing(false);
            setAttachmentsToDelete([]);
            setNewFiles([]);
            refetch();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.msg || 'Something went wrong');
        }
    });

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !answerToBeEditedData) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="mt-1 text-sm text-red-700">Failed to load answer data. Please try again.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDeleteAttachment = (id: number) => {
        setAttachmentsToDelete(prev => [...prev, id]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setNewFiles(prev => [...prev, ...selectedFiles]);
        }
    };

    const handleRemoveNewFile = (idx: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            setNewFiles(prev => [...prev, ...droppedFiles]);
        }
    };

    const handleSubmit = (values: { content: string }) => {
        mutateEditAnswer(values.content);
    };

    const initialValues = {
        content: answerToBeEditedData.content || ''
    };

    const currentAttachments = answerToBeEditedData.attachment?.filter(
        att => !attachmentsToDelete.includes(att.attachment_id)
    ) || [];

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Edit Answer - ID: {answer_id}
                </h1>
                <div className="space-x-2">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Edit Answer
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setAttachmentsToDelete([]);
                                setNewFiles([]);
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values }) => (
                    <Form className="space-y-6">
                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Answer Content
                            </label>
                            {!isEditing ? (
                                <div className="p-4 bg-gray-50 rounded-md border min-h-[150px] whitespace-pre-wrap">
                                    {answerToBeEditedData.content}
                                </div>
                            ) : (
                                <div>
                                    <Field
                                        name="content"
                                        as="textarea"
                                        rows={8}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                                        placeholder="Enter your answer content..."
                                    />
                                    <ErrorMessage name="content" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                            )}
                        </div>

                        {/* Current Attachments */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Attachments
                            </label>
                            <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                                {currentAttachments.length > 0 ? (
                                    <div className="space-y-3">
                                        {currentAttachments.map((attachment: Attachment) => (
                                            <div key={attachment.attachment_id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:shadow-sm transition-shadow">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                                                        <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                                                    </div>
                                                </div>
                                                {isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAttachment(attachment.attachment_id)}
                                                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                                        title="Delete attachment"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-gray-500 text-sm">No attachments</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add New Attachments - Only in Edit Mode */}
                        {isEditing && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Add New Attachments
                                </label>
                                
                                {/* Drag and Drop Area */}
                                <div
                                    className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                                        dragActive 
                                            ? 'border-blue-400 bg-blue-50' 
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-600">
                                            Drag and drop files here, or{' '}
                                            <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                                                browse
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Supports: Images, Documents, Archives</p>
                                    </div>
                                </div>

                                {/* New Files List */}
                                {newFiles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm font-medium text-gray-700">New Files:</p>
                                        {newFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                                <div className="flex items-center space-x-2">
                                                    <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveNewFile(idx)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit Buttons - Only in Edit Mode */}
                        {isEditing && (
                            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setAttachmentsToDelete([]);
                                        setNewFiles([]);
                                    }}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isEditingLoading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isEditingLoading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>Save Changes</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </Form>
                )}
            </Formik>
        </div>
    );
}

export default MyAnswerDataPage;