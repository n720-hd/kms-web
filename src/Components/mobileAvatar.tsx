import authStore from "@/zustand/authStore";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { useRouter } from "next/navigation";
import { mutateLogout } from "@/utils/handleLogout";

export const MobileAvatar: React.FC = () => {
  const { profilePictureUrl, firstName, lastName, email, setClearAuth } = authStore();

  console.log('MobileAvatar', profilePictureUrl, firstName, lastName, email);
  const router = useRouter();
  const logoutMutation = mutateLogout();

  const handleLogout = async() => {
    await logoutMutation.mutateAsync()
    setClearAuth()
    router.push('/')
  }
  return (
    <>
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200">
            <AvatarImage 
              src={profilePictureUrl ? (profilePictureUrl.startsWith('https://') ? profilePictureUrl : `http://localhost:4700/attachments/${profilePictureUrl}`) : ''} 
              alt={firstName}
              crossOrigin="use-credentials"
              className="h-full w-full object-cover"
            />
            <AvatarFallback className="h-full w-full bg-blue-500 text-white text-sm font-semibold flex items-center justify-center">
              {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-gray-900">{firstName} {lastName}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Sign out
        </button>
      </div>
      
      {/* Mobile Menu Links */}
      <div className="space-y-1">
        <a
          href="/profile"
          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
        >
          Profile
        </a>
        <a
          href="/settings"
          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
        >
          Settings
        </a>
      </div>
    </>
  );
};