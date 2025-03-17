import React from 'react';
import { BarChart2, Phone, Clock, TrendingUp, Mic2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { name: 'Total Calls', value: '1,234', icon: Phone, trend: '+12.3%' },
    { name: 'Avg. Duration', value: '3m 45s', icon: Clock, trend: '-2.1%' },
    { name: 'Success Rate', value: '94.2%', icon: TrendingUp, trend: '+5.4%' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
                <Icon className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="mt-4">
                <span className={`text-sm ${
                  stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend} vs last week
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Calls</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">+1 (555) 123-456{i}</p>
                  <p className="text-sm text-gray-500">2 minutes ago</p>
                </div>
                <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                  Successful
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Active Voice Agents</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Mic2 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">Sales Agent {i}</p>
                    <p className="text-sm text-gray-500">Last active: 5m ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="block w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;