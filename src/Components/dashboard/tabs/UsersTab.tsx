import React, { useState } from "react";
import {
  Filter,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  UserCheck,
  Building2,
  Check,
  X,
} from "lucide-react";
import { UsersTabsProps } from "../types";

interface ExtendedUsersTabProps extends UsersTabsProps {
  divisions?: any[];
  roles?: any[];
  setUserRole?: (params: { user_id: number; role_id: number }) => void;
  setUserDivision?: (params: { user_id: number; division_id: number }) => void;
  isPending?: boolean;
  setDivisionPending?: boolean;
}

const UsersTab = ({
  users,
  formatDate,
  divisions,
  roles,
  setUserRole,
  setUserDivision,
  isPending,
  setDivisionPending,
}: ExtendedUsersTabProps) => {
 const [editingUser, setEditingUser] = useState(null);
  const [tempDivision, setTempDivision] = useState<Record<number, number | null>>({});
  const [tempRole, setTempRole] = useState<Record<number, number | null>>({});

  const handleEditClick = (user: any) => {
    setEditingUser(user.user_id);
    setTempDivision({ [user.user_id]: user.division?.id || null });
    setTempRole({ [user.user_id]: user.role?.role_id });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setTempDivision({});
    setTempRole({});
  };

  const handleSaveChanges = (userId: number) => {
    const divisionChanged = tempDivision[userId] !== users!.find(u => u.user_id === userId).division?.id;
    const roleChanged = tempRole[userId] !== users!.find(u => u.user_id === userId).role?.role_id;

    if (divisionChanged && setUserDivision && tempDivision[userId] !== null) {
      setUserDivision({ user_id: userId, division_id: tempDivision[userId] });
    }

    if (roleChanged && setUserRole && tempRole[userId] !== null) {
      setUserRole({ user_id: userId, role_id: tempRole[userId] });
    }

    setEditingUser(null);
    setTempDivision({});
    setTempRole({});
  };

  // Default roles if not provided
  const defaultRoles = roles || [
    { role_id: 1, name: "admin" },
    { role_id: 2, name: "user" },
    { role_id: 3, name: "moderator" },
  ];

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Division
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((user) => {
              const isEditing = editingUser === user.user_id;
              
              return (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.first_name?.[0] || 'U'}
                        {user.last_name?.[0] || ''}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditing ? (
                      <select
                        value={tempDivision[user.user_id] || ''}
                        onChange={(e) => setTempDivision({ 
                          ...tempDivision, 
                          [user.user_id]: e.target.value ? parseInt(e.target.value) : null 
                        })}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={setDivisionPending}
                      >
                        <option value="">No division</option>
                        {divisions?.map((division) => (
                          <option key={division.id} value={division.id}>
                            {division.division_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center space-x-1 text-sm text-gray-700">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{user.division?.division_name || "No division"}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={tempRole[user.user_id] || ''}
                        onChange={(e) => setTempRole({ 
                          ...tempRole, 
                          [user.user_id]: parseInt(e.target.value) 
                        })}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isPending}
                      >
                        {defaultRoles.map((role) => (
                          <option key={role.role_id} value={role.role_id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${getRoleColor(user.role?.name)}`}>
                        <UserCheck className="w-3 h-3 mr-1" />
                        {user.role?.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <button 
                            onClick={() => handleSaveChanges(user.user_id)}
                            disabled={isPending || setDivisionPending}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;
