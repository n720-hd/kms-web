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

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginResponse {
  message: string;
  data: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    token: string;
    profile_picture: string ;
  };
  error: boolean;
}

// Validation schema
const loginSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .required('Username is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setAuth } = authStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormData): Promise<LoginResponse> => {
      const response = await instance.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Login success');
      // Update auth store
      setAuth({
        userId: data.data.id,
        firstName: data.data.first_name ,
        lastName: data.data.last_name ,
        email: data.data.email,
        profilePictureUrl: data.data.profile_picture,
        role: data.data.role,
        username: data.data.username,
        
      });
     

      data.data.role === 'admin' ? router.push('/dashboard') : router.push('/');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
    }
  });

  const initialValues: LoginFormData = {
    username: '',
    password: ''
  };

  const handleLogin = (values: LoginFormData) => {
    loginMutation.mutate(values);
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
        >
          {({ isSubmitting, touched, errors: formErrors }) => (
            <Form className="mt-8 space-y-6">
              {/* Error Message */}
              {loginMutation.isError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Login Failed
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {loginMutation.error?.response?.data?.message || 
                         loginMutation.error?.message || 
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
                    Username
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <Field
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${
                        touched.username && formErrors.username
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md focus:z-10 sm:text-sm`}
                      placeholder="Enter your username"
                    />
                  </div>
                  <ErrorMessage name="username" component="p" className="mt-1 text-sm text-red-600" />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`appearance-none relative block w-full pl-10 pr-10 py-2 border ${
                        touched.password && formErrors.password
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md focus:z-10 sm:text-sm`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-600" />
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loginMutation.isPending || isSubmitting}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <a href="/register/user" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign up here
                  </a>
                </p>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginPage;