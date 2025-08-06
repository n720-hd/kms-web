"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/utils/axiosInstance";
import LoadingWithSpinner from "@/Components/loadingWithSpinner";
import { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Validation schemas
  const profileValidationSchema = Yup.object({
    first_name: Yup.string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .required("First name is required"),
    last_name: Yup.string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .required("Last name is required"),
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .matches(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      )
      .required("Username is required"),
  });

  const passwordValidationSchema = Yup.object({
    oldPassword: Yup.string().required("Current password is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      )
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Please confirm your password"),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await instance.get("/profile");
      return response.data.data;
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation<any, Error, FormData>({
    mutationFn: async (formData) => {
      const response = await instance.patch("/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(res?.message);
      setIsEditing(false);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation<any, any, any>({
    mutationFn: async (passwordData) => {
      const response = await instance.patch(
        "/auth/change-password",
        passwordData
      );
      return response.data;
    },
    onSuccess: (res) => {
      setIsChangingPassword(false);
      toast.success(res?.msg || "Password changed successfully");
    },
  });

  interface ProfileFormValues {
    first_name: string;
    last_name: string;
    username: string;
  }

  const handleProfileSubmit = async (
    values: ProfileFormValues,
    { setSubmitting, setFieldError }: FormikHelpers<ProfileFormValues>
  ) => {
    try {
      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("username", values.username);

      if (profilePictureFile) {
        formData.append("profile_picture", profilePictureFile);
      }

      await updateProfileMutation.mutateAsync(formData);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      if (error.response?.data?.field) {
        setFieldError(error.response.data.field, errorMessage);
      } else {
        setFieldError("submit", errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  interface PasswordFormValues {
    oldPassword: string;
    password: string;
    confirmPassword: string;
  }

  const handlePasswordSubmit = async (
    values: PasswordFormValues,
    { setSubmitting, setFieldError, resetForm }: FormikHelpers<PasswordFormValues>
  ) => {
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword: values.oldPassword,
        password: values.password,
      });
      resetForm();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to change password";
      if (error.response?.data?.field === "password") {
        setFieldError("password", errorMessage);
      } else {
        setFieldError("oldPassword", errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setProfilePictureFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePicturePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) return <LoadingWithSpinner />;

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600">Unable to load profile information</p>
        </div>
      </div>
    );

  // Fixed: Removed TypeScript type annotation
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "👤" },
    { id: "activity", label: "Activity", icon: "📊" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const getProfilePictureUrl = () => {
    if (profilePicturePreview) return profilePicturePreview;
    if (data?.profile_picture) {
      // If it's already a full URL (S3), use it directly
      if (data.profile_picture.startsWith('https://')) {
        return data.profile_picture;
      }
      // Otherwise, construct the old-style URL
      const baseUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4700";
      return `${baseUrl}/attachments/${data.profile_picture}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                {getProfilePictureUrl() ? (
                  <img
                    src={getProfilePictureUrl() || '/default-avatar.png'}
                    alt={`${data.first_name}'s profile`}
                    className="w-full h-full object-cover"
                    crossOrigin="use-credentials"
                    onError={(e) => {
                      console.error("Image failed to load:", e);
                      e.currentTarget.onerror = null; // Prevent infinite loop
                      e.currentTarget.src = "/default-avatar.png"; // Fallback image
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-3xl font-bold">
                    {data.first_name?.[0]?.toUpperCase()}
                    {data.last_name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {isEditing && (
                <>
                  <button
                    onClick={triggerFileInput}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {/* Profile Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {data.first_name} {data.last_name}
              </h1>
              <p className="text-blue-100 text-lg mb-1">@{data.username}</p>
              <p className="text-blue-200 mb-2">{data.email}</p>
              {data.division && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm">
                  🏢 {data.division.division_name}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditing
                    ? "bg-gray-500 text-white hover:bg-gray-600"
                    : "bg-white text-blue-600 hover:bg-gray-100"
                }`}
              >
                {isEditing ? "Cancel Edit" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {/* <div className="container mx-auto px-4 -mt-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-gray-600 text-sm">Questions Asked</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-green-600">35</div>
            <div className="text-gray-600 text-sm">Answers Given</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">128</div>
            <div className="text-gray-600 text-sm">Reputation</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-gray-600 text-sm">Badges Earned</div>
          </div>
        </div>
      </div> */}

      {/* Tabs Navigation */}
      <div className="container mx-auto px-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Personal Information
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <Formik
                      initialValues={{
                        first_name: data.first_name || "",
                        last_name: data.last_name || "",
                        username: data.username || "",
                      }}
                      validationSchema={profileValidationSchema}
                      onSubmit={handleProfileSubmit}
                    >
                      {({ isSubmitting }) => (
                        <Form className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                              </label>
                              <Field
                                name="first_name"
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <ErrorMessage
                                name="first_name"
                                component="div"
                                className="text-red-500 text-sm mt-1"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                              </label>
                              <Field
                                name="last_name"
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <ErrorMessage
                                name="last_name"
                                component="div"
                                className="text-red-500 text-sm mt-1"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                              </label>
                              <Field
                                name="username"
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <ErrorMessage
                                name="username"
                                component="div"
                                className="text-red-500 text-sm mt-1"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email (Read Only)
                              </label>
                              <input
                                type="email"
                                value={data.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                              />
                            </div>
                          </div>

                          <ErrorMessage
                            name="submit"
                            component="div"
                            className="text-red-500 text-sm"
                          />

                          <div className="flex space-x-3 pt-4">
                            <button
                              type="submit"
                              disabled={
                                isSubmitting || updateProfileMutation.isPending
                              }
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting || updateProfileMutation.isPending
                                ? "Saving..."
                                : "Save Changes"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditing(false)}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </Form>
                      )}
                    </Formik>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Full Name
                          </label>
                          <p className="text-gray-900">
                            {data.first_name} {data.last_name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Username
                          </label>
                          <p className="text-gray-900">@{data.username}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Email
                          </label>
                          <p className="text-gray-900">{data.email}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Role
                          </label>
                          <p className="text-gray-900 capitalize">
                            {data.role || "Member"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Division
                          </label>
                          <p className="text-gray-900">
                            {data.division?.division_name || "Not assigned"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Member Since
                          </label>
                          <p className="text-gray-900">
                            {formatDate(data.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Change Password Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Security
                    </h3>
                    {!isChangingPassword && (
                      <button
                        onClick={() => setIsChangingPassword(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {isChangingPassword ? (
                    <Formik
                      initialValues={{
                        oldPassword: "",
                        password: "",
                        confirmPassword: "",
                      }}
                      validationSchema={passwordValidationSchema}
                      onSubmit={handlePasswordSubmit}
                    >
                      {({ isSubmitting }) => (
                        <Form className="space-y-4 max-w-md">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Current Password
                            </label>
                            <Field
                              name="oldPassword"
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <ErrorMessage
                              name="oldPassword"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              New Password
                            </label>
                            <Field
                              name="password"
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <ErrorMessage
                              name="password"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <Field
                              name="confirmPassword"
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <ErrorMessage
                              name="confirmPassword"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          {/* Added error display for general password errors */}
                          {changePasswordMutation.isError &&
                            !changePasswordMutation.error?.response?.data
                              ?.field && (
                              <div className="text-red-500 text-sm">
                                {changePasswordMutation.error?.response?.data
                                  ?.message || "Failed to change password"}
                              </div>
                            )}

                          <div className="flex space-x-3 pt-4">
                            <button
                              type="submit"
                              disabled={
                                isSubmitting || changePasswordMutation.isPending
                              }
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting || changePasswordMutation.isPending
                                ? "Changing..."
                                : "Change Password"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsChangingPassword(false)}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </Form>
                      )}
                    </Formik>
                  ) : (
                    <div>
                      <p className="text-gray-600">••••••••••••</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Last changed: Unknown
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                {/* <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">❓</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Asked a question about Node.js modules
                        </p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">✅</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Answered a React question
                        </p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-sm">⭐</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Received 5 upvotes on an answer
                        </p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            )}

            {activeTab === "activity" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Activity Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Questions</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Total Asked
                        </span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Answered</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Accepted Answers
                        </span>
                        <span className="font-medium">6</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Engagement</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Answers Given
                        </span>
                        <span className="font-medium">35</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Comments Made
                        </span>
                        <span className="font-medium">47</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Upvotes Received
                        </span>
                        <span className="font-medium">128</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Account Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Email Notifications
                      </h4>
                      <p className="text-sm text-gray-600">
                        Receive notifications for new answers and comments
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Profile Visibility
                      </h4>
                      <p className="text-sm text-gray-600">
                        Make your profile visible to other users
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t">
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
