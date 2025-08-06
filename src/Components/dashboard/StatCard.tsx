import { TrendingUp } from "lucide-react";
 
 const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: number | string | undefined;
    icon: any;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value !== undefined && value !== null ? value : 0}
          </p>
          {trend && (
            <div className="flex items-center mt-1">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

export default StatCard;