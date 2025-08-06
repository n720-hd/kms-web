'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import instance from '@/utils/axiosInstance';
import authStore from '@/zustand/authStore';
import { toast } from 'react-toastify';

interface RegisterUserFormData {
  email: string;
}

interface RegisterUserResponse {
  message: string;
  data: {};
  error: boolean;
}

const RegisterCreatorSchema = Yup.object().shape({
  email: Yup.string()
    .min(3, 'Email must be at least 3 characters')
    .max(50, 'Email must be less than 50 characters')
    .email('Invalid email format')
    .required('Email is required'),
 
});

const RegisterPageCreator = () => {
  const router = useRouter();

  const registerCreatorMutation = useMutation({
    mutationFn: async (credentials: RegisterUserFormData): Promise<RegisterUserResponse> => {
      const response = await instance.post('/auth/register/user', credentials);
      return response.data;
    },
    onSuccess: () => {
        toast.success('Registration successful');
        router.push('/');
    },
    onError: (error: any) => {
        toast.error(error.response?.data?.msg || 'Registration failed');
      console.error('Login error:', error);
    }
  });

  const initialValues: RegisterUserFormData = {
    email: ''
  };

  const handleRegisterCreator = (values: RegisterUserFormData) => {
    registerCreatorMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Register as Creator
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to proceed with registration.
          </p>
        </div>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={RegisterCreatorSchema}
          onSubmit={handleRegisterCreator}
        >
          {({ isSubmitting, touched, errors: formErrors }) => (
            <Form className="mt-8 space-y-6">
              {/* Error Message */}
              {registerCreatorMutation.isError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Register Failed
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {registerCreatorMutation.error?.response?.data?.message || 
                         registerCreatorMutation.error?.message || 
                         'Invalid username or password'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <Field
                      id="email"
                      name="email"
                      type="text"
                      autoComplete="email"
                      className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${
                        touched.email && formErrors.email
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md focus:z-10 sm:text-sm`}
                      placeholder="Enter your email"
                    />
                  </div>
                  <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={registerCreatorMutation.isPending || isSubmitting}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerCreatorMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default RegisterPageCreator;