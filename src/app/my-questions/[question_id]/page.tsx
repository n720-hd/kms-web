"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import instance from "@/utils/axiosInstance";
import LoadingWithSpinner from "@/Components/loadingWithSpinner";
import { useState } from "react";
import {
  PersonalCollaborator,
  DivisionCollaborator,
  Tags,
} from "@/Components/create-question/types";
import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

// Validation schema
const validationSchema = Yup.object({
  title: Yup.string()
    .required("Title is required")
    .min(5, "Title must be at least 5 characters"),
  content: Yup.string()
    .required("Content is required")
    .min(10, "Content must be at least 10 characters"),
  due_date: Yup.date().nullable(),
  collaborator_type: Yup.string()
    .oneOf(["PERSONAL", "DIVISION", "NONE"])
    .required("Collaborator type is required"),
});

const MyQuestionDataPage = ({
  params,
}: {
  params: Promise<{ question_id: string }>;
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([]);
  const [tagsToDelete, setTagsToDelete] = useState<number[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState<string>("");
  const [personalSearchTerm, setPersonalSearchTerm] = useState<string>("");
  const [divisionSearchTerm, setDivisionSearchTerm] = useState<string>("");
  const [showPersonalDropdown, setShowPersonalDropdown] =
    useState<boolean>(false);
  const [showDivisionDropdown, setShowDivisionDropdown] =
    useState<boolean>(false);
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const question_id = unwrappedParams.question_id;

  const {
    data: questionToBeEditedData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["questionToBeEdited", question_id],
    queryFn: async () => {
      const response = await instance.get(`/question/${question_id}/edit`);
      return response.data.data;
    },
  });

  // Fetch available tags
  const { data: tags = [] } = useQuery({
    queryKey: ["available-tags"],
    queryFn: async () => {
      const response = await instance.get("question/tags");
      return response.data.data;
    },
  });

  console.log(tags);

  const { mutate: mutateEditQuestion, isPending: isEditingLoading } =
    useMutation({
      mutationFn: async (formData: any) => {
        const response = await instance.patch(`/question`, formData);
        return response.data.data;
      },
      onSuccess: (data) => {
        toast.success(data.message || "Question edited successfully");
        setIsEditing(false);
        router.push("/my-questions");
      },
      onError: (error) => {
        toast.error(error?.response?.data?.msg || "Something went wrong");
        console.error("Error editing question", error);
      },
    });

  // Fetch personal collaborators
  const { data: personalCollaborators = [] } = useQuery<PersonalCollaborator[]>(
    {
      queryKey: ["personal-collaborators"],
      queryFn: async () => {
        const response = await instance.get("/question/collaborators/personal");
        return response.data.data;
      },
      enabled: true,
    }
  );

  // Fetch question rating
  const { data: questionRating = [] } = useQuery({
    queryKey: ["question-rating", question_id],
    queryFn: async () => {
      const response = await instance.get("/question/feedback", {
        params: { question_id },
      });
      return response.data.data;
    },
  });

  console.log("Question Rating:", questionRating);

  // Fetch division collaborators
  const { data: divisionCollaborators = [] } = useQuery<DivisionCollaborator[]>(
    {
      queryKey: ["division-collaborators"],
      queryFn: async () => {
        const response = await instance.get("/question/collaborators/division");
        return response.data.data;
      },
      enabled: true,
    }
  );

  // Initialize selected tags when question data loads
  React.useEffect(() => {
    if (questionToBeEditedData?.tags) {
      setSelectedTags(
        questionToBeEditedData.tags.map((tag: Tags) => tag.tag_id)
      );
    }
  }, [questionToBeEditedData]);

  // Close dropdowns when editing mode changes
  React.useEffect(() => {
    if (!isEditing) {
      setShowPersonalDropdown(false);
      setShowDivisionDropdown(false);
      setPersonalSearchTerm("");
      setDivisionSearchTerm("");
      setTagSearchTerm("");
    }
  }, [isEditing]);

  if (isLoading) return <LoadingWithSpinner />;
  if (!questionToBeEditedData || isError) {
    router.push("/my-questions");
    return null;
  }

  // Format date for input field
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  // Initial form values
  const initialValues = {
    question_id: questionToBeEditedData.question_id,
    title: questionToBeEditedData.title || "",
    content: questionToBeEditedData.content || "",
    due_date: formatDateForInput(questionToBeEditedData.due_date),
    collaborator_type: questionToBeEditedData.collaborator_type || "NONE",
    collaborator_id: questionToBeEditedData.collaborator_id || "",
    collaborator_division_id:
      questionToBeEditedData.collaborator_division_id || "",
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTags((prev) => {
      const isSelected = prev.includes(tagId);
      const originalTags = questionToBeEditedData.tags.map(
        (tag: any) => tag.tag_id
      );

      if (isSelected) {
        // Removing tag
        if (originalTags.includes(tagId)) {
          setTagsToDelete((prevDelete) => [
            ...prevDelete.filter((id) => id !== tagId),
            tagId,
          ]);
        }
        return prev.filter((id) => id !== tagId);
      } else {
        // Adding tag
        setTagsToDelete((prevDelete) =>
          prevDelete.filter((id) => id !== tagId)
        );
        return [...prev, tagId];
      }
    });
  };

  const handleAttachmentDelete = (attachmentId: number) => {
    setAttachmentsToDelete((prev) => [...prev, attachmentId]);
  };

  // Helper functions for search and display
  const getPersonalCollaboratorName = (id: number) => {
    const collaborator = personalCollaborators.find((c) => c.id === id);
    return collaborator
      ? `${collaborator.username}${
          collaborator.division ? ` (${collaborator.division})` : ""
        }`
      : "Unknown";
  };

  const getDivisionCollaboratorName = (id: number) => {
    const collaborator = divisionCollaborators.find((c) => c.id === id);
    return collaborator ? collaborator.division_name : "Unknown";
  };

  const getTagName = (id: number) => {
    const tag = tags.find((t: Tags) => t.tag_id === id);
    return tag ? tag.name : `Tag ${id}`;
  };

  // Filter functions for search
  const filteredPersonalCollaborators = personalCollaborators.filter(
    (collaborator) =>
      (collaborator.username &&
        collaborator.username
          .toLowerCase()
          .includes(personalSearchTerm.toLowerCase())) ||
      (collaborator.division &&
        collaborator.division
          .toLowerCase()
          .includes(personalSearchTerm.toLowerCase()))
  );

  const filteredDivisionCollaborators = divisionCollaborators.filter(
    (collaborator) =>
      collaborator.division_name &&
      collaborator.division_name
        .toLowerCase()
        .includes(divisionSearchTerm.toLowerCase())
  );

  const filteredTags = tags.filter(
    (tag: Tags) =>
      !selectedTags.includes(tag.tag_id) &&
      tag.name &&
      tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const handleSubmit = (values: any) => {
    const formData = {
      ...values,
      tag_ids: selectedTags,
      attachmentsToDelete,
      tagsToDelete,
    };

    // Clean up collaborator fields based on type
    if (values.collaborator_type === "NONE") {
      formData.collaborator_id = null;
      formData.collaborator_division_id = null;
    } else if (values.collaborator_type === "PERSONAL") {
      formData.collaborator_division_id = null;
    } else if (values.collaborator_type === "DIVISION") {
      formData.collaborator_id = null;
    }

    mutateEditQuestion(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Main Question Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Question Details</h1>
            <div className="space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-50 transition-colors font-medium shadow-sm"
                >
                  <svg
                    className="w-4 h-4 inline mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Question
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium shadow-sm"
                >
                  <svg
                    className="w-4 h-4 inline mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, setFieldValue }) => (
              <Form className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  {!isEditing ? (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {questionToBeEditedData.title}
                      </h2>
                    </div>
                  ) : (
                    <div>
                      <Field
                        name="title"
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter question title"
                      />
                      <ErrorMessage
                        name="title"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  {!isEditing ? (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[120px]">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {questionToBeEditedData.content}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Field
                        name="content"
                        as="textarea"
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter question content"
                      />
                      <ErrorMessage
                        name="content"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  {!isEditing ? (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-gray-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-gray-800">
                          {questionToBeEditedData.due_date
                            ? new Date(
                                questionToBeEditedData.due_date
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "No due date set"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Field
                      name="due_date"
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        questionToBeEditedData.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : questionToBeEditedData.status === "ASSIGNED"
                          ? "bg-blue-100 text-blue-800"
                          : questionToBeEditedData.status === "ANSWERED"
                          ? "bg-green-100 text-green-800"
                          : questionToBeEditedData.status === "CLOSED"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          questionToBeEditedData.status === "PENDING"
                            ? "bg-yellow-400"
                            : questionToBeEditedData.status === "ASSIGNED"
                            ? "bg-blue-400"
                            : questionToBeEditedData.status === "ANSWERED"
                            ? "bg-green-400"
                            : questionToBeEditedData.status === "CLOSED"
                            ? "bg-gray-400"
                            : "bg-red-400"
                        }`}
                      ></span>
                      {questionToBeEditedData.status}
                    </span>
                  </div>
                </div>

                {/* Collaborator Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collaborator Type
                  </label>
                  {!isEditing ? (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          questionToBeEditedData.collaborator_type ===
                          "PERSONAL"
                            ? "bg-green-100 text-green-800"
                            : questionToBeEditedData.collaborator_type ===
                              "DIVISION"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {questionToBeEditedData.collaborator_type}
                      </span>
                    </div>
                  ) : (
                    <Field
                      name="collaborator_type"
                      as="select"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setFieldValue("collaborator_type", e.target.value);
                        setFieldValue("collaborator_id", "");
                        setFieldValue("collaborator_division_id", "");
                        // Close any open dropdowns
                        setShowPersonalDropdown(false);
                        setShowDivisionDropdown(false);
                        setPersonalSearchTerm("");
                        setDivisionSearchTerm("");
                      }}
                    >
                      <option value="NONE">None</option>
                      <option value="PERSONAL">Personal</option>
                      <option value="DIVISION">Division</option>
                    </Field>
                  )}
                </div>

                {/* Personal Collaborator */}
                {values.collaborator_type === "PERSONAL" && isEditing && (
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Collaborator
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for a collaborator..."
                        value={
                          values.collaborator_id
                            ? getPersonalCollaboratorName(
                                values.collaborator_id
                              )
                            : personalSearchTerm
                        }
                        onChange={(e) => {
                          setPersonalSearchTerm(e.target.value);
                          setShowPersonalDropdown(true);
                          if (!e.target.value) {
                            setFieldValue("collaborator_id", "");
                          }
                        }}
                        onFocus={() => setShowPersonalDropdown(true)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {showPersonalDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredPersonalCollaborators.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            No collaborators found
                          </div>
                        ) : (
                          filteredPersonalCollaborators.map((collaborator) => (
                            <button
                              key={collaborator.id}
                              type="button"
                              onClick={() => {
                                setFieldValue(
                                  "collaborator_id",
                                  collaborator.id
                                );
                                setPersonalSearchTerm("");
                                setShowPersonalDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150"
                            >
                              <div className="flex items-center space-x-3">
                                {collaborator.profile_picture ? (
                                  <img
                                    src={`${instance.defaults.baseURL?.replace(
                                      "/api",
                                      ""
                                    )}/profiles/${
                                      collaborator.profile_picture
                                    }`}
                                    alt={collaborator.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-gray-600 text-sm font-medium">
                                      {collaborator.username
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {collaborator.username}
                                  </div>
                                  {collaborator.division && (
                                    <div className="text-sm text-gray-500">
                                      {collaborator.division}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {/* Click outside to close */}
                    {showPersonalDropdown && (
                      <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowPersonalDropdown(false)}
                      ></div>
                    )}
                  </div>
                )}

                {/* Show selected personal collaborator in read-only mode */}
                {values.collaborator_type === "PERSONAL" &&
                  !isEditing &&
                  questionToBeEditedData.collaborator_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Collaborator
                      </label>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-gray-400 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="text-gray-800">
                            {getPersonalCollaboratorName(
                              questionToBeEditedData.collaborator_id
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Division Collaborator */}
                {values.collaborator_type === "DIVISION" && isEditing && (
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Division Collaborator
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for a division..."
                        value={
                          values.collaborator_division_id
                            ? getDivisionCollaboratorName(
                                values.collaborator_division_id
                              )
                            : divisionSearchTerm
                        }
                        onChange={(e) => {
                          setDivisionSearchTerm(e.target.value);
                          setShowDivisionDropdown(true);
                          if (!e.target.value) {
                            setFieldValue("collaborator_division_id", "");
                          }
                        }}
                        onFocus={() => setShowDivisionDropdown(true)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {showDivisionDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredDivisionCollaborators.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            No divisions found
                          </div>
                        ) : (
                          filteredDivisionCollaborators.map((collaborator) => (
                            <button
                              key={collaborator.id}
                              type="button"
                              onClick={() => {
                                setFieldValue(
                                  "collaborator_division_id",
                                  collaborator.id
                                );
                                setDivisionSearchTerm("");
                                setShowDivisionDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {collaborator.division_name}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {/* Click outside to close */}
                    {showDivisionDropdown && (
                      <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowDivisionDropdown(false)}
                      ></div>
                    )}
                  </div>
                )}

                {/* Show selected division collaborator in read-only mode */}
                {values.collaborator_type === "DIVISION" &&
                  !isEditing &&
                  questionToBeEditedData.collaborator_division_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Division Collaborator
                      </label>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-gray-400 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <span className="text-gray-800">
                            {getDivisionCollaboratorName(
                              questionToBeEditedData.collaborator_division_id
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  {!isEditing ? (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {questionToBeEditedData.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {questionToBeEditedData.tags.map((tag: any) => (
                            <span
                              key={tag.tag_id}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {getTagName(tag.tag_id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No tags assigned</span>
                      )}
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4">
                      {/* Selected Tags */}
                      {selectedTags.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Selected tags:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tagId) => (
                              <span
                                key={tagId}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium gap-2"
                              >
                                {getTagName(tagId)}
                                <button
                                  type="button"
                                  onClick={() => handleTagToggle(tagId)}
                                  className="text-blue-600 hover:text-blue-800 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tag Search */}
                      <div className="border-t pt-4">
                        <div className="relative mb-3">
                          <input
                            type="text"
                            placeholder="Search tags..."
                            value={tagSearchTerm}
                            onChange={(e) => setTagSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Available Tags */}
                        <div className="max-h-48 overflow-y-auto">
                          {filteredTags.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">
                              {tagSearchTerm
                                ? "No tags found matching your search"
                                : "No more tags available"}
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {filteredTags.map((tag: any) => (
                                <button
                                  key={tag.tag_id}
                                  type="button"
                                  onClick={() => handleTagToggle(tag.tag_id)}
                                  className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors duration-150 border border-gray-200 hover:border-gray-300"
                                >
                                  <span className="text-gray-700">
                                    + {tag.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {questionToBeEditedData.attachment?.length > 0 ? (
                      <div className="space-y-2">
                        {questionToBeEditedData.attachment
                          .filter(
                            (att: any) =>
                              !attachmentsToDelete.includes(att.attachment_id)
                          )
                          .map((attachment: any) => (
                            <div
                              key={attachment.attachment_id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                            >
                              <div className="flex items-center">
                                <svg
                                  className="w-5 h-5 text-gray-400 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486L20.5 13"
                                  />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">
                                  {attachment.file_name}
                                </span>
                              </div>
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAttachmentDelete(
                                      attachment.attachment_id
                                    )
                                  }
                                  className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-150"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <svg
                          className="w-8 h-8 text-gray-300 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        <span className="text-gray-500 text-sm">
                          No attachments
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                {isEditing && (
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditingLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50 font-medium shadow-sm"
                    >
                      {isEditingLoading ? (
                        <div className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </div>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                )}
              </Form>
            )}
          </Formik>
        </div>
      </div>

      {/* Question Feedback Section - Only show when not editing */}
      {!isEditing && questionRating && questionRating.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Question Feedback ({questionRating.length})
            </h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {questionRating.map((feedback: any) => (
                <div
                  key={feedback.feedback_id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start space-x-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {feedback.user.profile_picture ? (
                        <img
                          src={
                            feedback.user.profile_picture
                              ? feedback.user.profile_picture.startsWith('https://') 
                                ? feedback.user.profile_picture 
                                : `http://localhost:4700/attachments/${feedback.user.profile_picture}`
                              : ""
                          }
                          crossOrigin="use-credentials"
                          alt={feedback.user.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="text-white text-lg font-bold">
                            {feedback.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Feedback Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {feedback.user.first_name && feedback.user.last_name
                              ? `${feedback.user.first_name} ${feedback.user.last_name}`
                              : feedback.user.username}
                          </h4>
                          <span className="text-sm text-gray-500">
                            @{feedback.user.username}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {renderStarRating(feedback.rating)}
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {feedback.content}
                      </p>

                      <div className="flex items-center text-xs text-gray-500">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatDateForDisplay(feedback.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyQuestionDataPage;