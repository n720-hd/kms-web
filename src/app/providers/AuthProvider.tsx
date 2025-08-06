"use client";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import LoadingWithSpinner from "@/Components/loadingWithSpinner";
import instance from "@/utils/axiosInstance";
import authStore from "@/zustand/authStore";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { setKeepAuth, setClearAuth } = authStore();
  const role = authStore((state) => state.role);

  const checkAuth = async () => {
    try {
      const res = await instance.get("/auth");
     
      if (res.data?.data && res.data.message === 'Success') {
        const userData = res.data.data;
        setKeepAuth({
          userId: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          email: userData.email,
          profilePictureUrl: userData.profile_picture,
          role: userData.role,
          username: userData.username,
        });
        return { isAuthenticated: true, userRole: userData.role };
      } else {
        setClearAuth();
        return { isAuthenticated: false, userRole: null };
      }
    } catch (error) {
      setClearAuth();
      return { isAuthenticated: false, userRole: null };
    }
  };
  
  const getNotification = async () => {
    try {
      const notification = await instance.get('/question/notifications');
    } catch (error) {
    }
  }
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/questions/ask', '/settings', '/discussion', '/chat', '/ai'];
  const adminRoutes = ['/dashboard'];
  const guestOnlyRoutes = ['/login', '/register'];

  // Check if current path needs protection
  const needsAuth = protectedRoutes.some(route => pathname.startsWith(route));
  const needsAdmin = adminRoutes.some(route => pathname.startsWith(route));
  const isGuestOnly = guestOnlyRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    const initAuth = async () => {
      const { isAuthenticated, userRole } = await checkAuth();
      await getNotification();
      
      // Redirect logic
      if (needsAuth && !isAuthenticated) {
        router.push('/login?redirect=' + encodeURIComponent(pathname));
      } else if (needsAdmin && (!isAuthenticated || userRole !== 'admin')) {
        router.push('/login?redirect=' + encodeURIComponent(pathname));
      } else if (isGuestOnly && isAuthenticated) {
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
        router.push(redirectUrl ? decodeURIComponent(redirectUrl) : '/');
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, [pathname]);

  if (isLoading) {
    return <LoadingWithSpinner />;
  }

  return <>{children}</>;
};

export default AuthProvider;