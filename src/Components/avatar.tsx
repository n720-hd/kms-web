import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import React from "react";
import authStore from "@/zustand/authStore";
import { useState } from "react";
import { mutateLogout } from "@/utils/handleLogout";
import { useRouter } from "next/navigation";

export const AvatarWithFallback: React.FC = () => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { profilePictureUrl, firstName, lastName, setClearAuth, role } = authStore();

  const logoutMutation = mutateLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setClearAuth();
    router.push('/');
  };

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Avatar className="h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200">
          <AvatarImage
            src={
              profilePictureUrl
                ? profilePictureUrl.startsWith('https://') 
                  ? profilePictureUrl 
                  : `http://localhost:4700/attachments/${profilePictureUrl}`
                : ""
            }
            crossOrigin="use-credentials"
            alt={firstName}
            className="h-full w-full object-cover"
          />
          <AvatarFallback className="h-full w-full bg-blue-500 text-white text-sm font-semibold flex items-center justify-center">
            {firstName?.[0]?.toUpperCase()}
            {lastName?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:block text-sm font-medium text-gray-700">
          {firstName} {lastName}
        </span>
        <svg
          className="hidden md:block w-4 h-4 text-gray-400"
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
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          {role === 'admin' && (
            <a
              href="/dashboard"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsDropdownOpen(false)}
            >
             Dashboard
            </a>
          )}
          <a
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDropdownOpen(false)}
          >
            Profile
          </a>
          <a
            href="/saved-questions"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDropdownOpen(false)}
          >
            Saved Questions
          </a>
          <a
            href="/my-questions"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDropdownOpen(false)}
          >
            My Questions
          </a>
          <a
            href="/my-answer"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDropdownOpen(false)}
          >
            My Answer
          </a>
          <hr className="my-1" />
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
