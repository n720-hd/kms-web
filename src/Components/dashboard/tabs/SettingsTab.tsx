import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Activity } from 'lucide-react';

interface SettingsTabProps {
  setMaintenanceMode?: (mode: boolean) => void;
  setMaintenancePending?: boolean;
  maintenanceModeStatus?: boolean;
  maintenanceModeStatusLoading?: boolean;
}

const SettingsTab = ({ 
  setMaintenanceMode, 
  setMaintenancePending, 
  maintenanceModeStatus, 
  maintenanceModeStatusLoading 
}: SettingsTabProps) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);
  const [pendingMode, setPendingMode] = useState<boolean>(false);

  // Update local state when backend status changes
  useEffect(() => {
    if (maintenanceModeStatus !== undefined) {
      setIsMaintenanceMode(maintenanceModeStatus);
    }
  }, [maintenanceModeStatus]);

  const handleMaintenanceModeToggle = () => {
    setPendingMode(!isMaintenanceMode);
    setShowMaintenanceModal(true);
  };

  const confirmMaintenanceMode = () => {
    const newMode = pendingMode;
    
    // Update local state optimistically
    setIsMaintenanceMode(newMode);
    
    if (setMaintenanceMode) {
      setMaintenanceMode(newMode);
    }
    setShowMaintenanceModal(false);
  };

  const cancelMaintenanceMode = () => {
    setShowMaintenanceModal(false);
    setPendingMode(isMaintenanceMode);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">System Settings</h3>
      
      <div className="space-y-6">
        {/* Maintenance Mode Section */}
        <div className={`bg-white border rounded-lg p-6 ${isMaintenanceMode ? 'border-orange-300' : ''}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${isMaintenanceMode ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${isMaintenanceMode ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900">Maintenance Mode</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {isMaintenanceMode 
                    ? 'The system is currently in maintenance mode. Users cannot access the platform.'
                    : 'Enable maintenance mode to prevent users from accessing the platform during updates.'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isMaintenanceMode}
                onChange={handleMaintenanceModeToggle}
                disabled={setMaintenancePending}
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 ${
                isMaintenanceMode ? 'peer-focus:ring-orange-300' : 'peer-focus:ring-blue-300'
              } rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                isMaintenanceMode ? 'peer-checked:bg-orange-600' : 'peer-checked:bg-blue-600'
              }`}></div>
            </label>
          </div>
          {isMaintenanceMode && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-orange-800">
                  Maintenance mode is active. Remember to disable it when maintenance is complete.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Mode Confirmation Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${pendingMode ? 'bg-orange-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${pendingMode ? 'text-orange-600' : 'text-green-600'}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {pendingMode ? 'Enable Maintenance Mode?' : 'Disable Maintenance Mode?'}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {pendingMode 
                ? 'This will prevent all users from accessing the platform. Only administrators will have access.'
                : 'Users will be able to access the platform again. Make sure all maintenance tasks are completed.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelMaintenanceMode}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmMaintenanceMode}
                disabled={setMaintenancePending}
                className={`px-4 py-2 rounded-lg text-white ${
                  pendingMode 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {setMaintenancePending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;