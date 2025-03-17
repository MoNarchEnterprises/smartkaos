import React, { useState, useEffect } from 'react';
import { Users, BarChart2, CreditCard, Calendar, Bell, Check, AlertCircle, History, Settings2, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

interface UserProfile {
  id: string;
  email: string;
  business_name: string;
  subscription: string;
  last_active_at: string;
  total_calls: number;
  subscription_status: string;
  calls_remaining: number;
  rollover_calls: number;
  min_schedule_time: number;
  current_period_start?: string;
  current_period_end?: string;
  trial_used: boolean;
  trial_calls_remaining: number;
  next_billing_date?: string;
  auto_renew: boolean;
}

interface UsageRecord {
  date: string;
  calls_made: number;
  duration: number;
  success_rate: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCalls: 0,
    totalRevenue: 0,
    trialUsers: 0,
    paidUsers: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!supabase) {
      setError('Database connection not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // For demo mode, return mock data
      if (!user?.email?.includes('demo@example.com')) {
        setError('Unauthorized: Admin access required');
        setIsLoading(false);
        return;
      }

      // Mock data for demo
      const mockUsers: UserProfile[] = [
        {
          id: '1',
          email: 'customer@example.com',
          business_name: 'Demo Customer',
          subscription: 'trial',
          last_active_at: new Date().toISOString(),
          total_calls: 25,
          subscription_status: 'active',
          calls_remaining: 25,
          rollover_calls: 0,
          min_schedule_time: 15,
          trial_used: false,
          trial_calls_remaining: 25,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: false
        },
        {
          id: '2',
          email: 'pro@example.com',
          business_name: 'Pro User',
          subscription: 'pro',
          last_active_at: new Date().toISOString(),
          total_calls: 500,
          subscription_status: 'active',
          calls_remaining: 500,
          rollover_calls: 100,
          min_schedule_time: 15,
          trial_used: true,
          trial_calls_remaining: 0,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          next_billing_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: true
        },
        {
          id: '3',
          email: 'expired@example.com',
          business_name: 'Expired User',
          subscription: 'starter',
          last_active_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          total_calls: 75,
          subscription_status: 'expired',
          calls_remaining: 0,
          rollover_calls: 0,
          min_schedule_time: 15,
          trial_used: true,
          trial_calls_remaining: 0,
          current_period_start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          current_period_end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: false
        }
      ];

      setUsers(mockUsers);
      
      // Calculate stats
      const activeUsers = mockUsers.filter(u => 
        new Date(u.last_active_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;

      const trialUsers = mockUsers.filter(u => !u.trial_used).length;
      const paidUsers = mockUsers.filter(u => 
        u.subscription !== 'trial' && u.subscription_status === 'active'
      ).length;
      
      setStats({
        totalUsers: mockUsers.length,
        activeUsers,
        totalCalls: mockUsers.reduce((acc, u) => acc + (u.total_calls || 0), 0),
        totalRevenue: mockUsers.reduce((acc, u) => {
          if (u.subscription_status !== 'active') return acc;
          switch (u.subscription) {
            case 'starter': return acc + 10;
            case 'pro': return acc + 49;
            case 'enterprise': return acc + 199;
            default: return acc;
          }
        }, 0),
        trialUsers,
        paidUsers
      });

    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? {
              ...user,
              subscription_status: isActive ? 'active' : 'expired',
              last_active_at: isActive ? new Date().toISOString() : user.last_active_at
            }
          : user
      )
    );
  };

  const UserModal = () => {
    if (!selectedUser) return null;

    const isActive = selectedUser.subscription_status === 'active';
    const [minScheduleTime, setMinScheduleTime] = useState(selectedUser.min_schedule_time || 15);

    const handleMinScheduleTimeUpdate = async () => {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id
            ? { ...user, min_schedule_time: minScheduleTime }
            : user
        )
      );
      setSelectedUser(prev => prev ? { ...prev, min_schedule_time: minScheduleTime } : null);
    };

    const getSubscriptionBadgeColor = (subscription: string) => {
      switch (subscription) {
        case 'enterprise': return 'bg-purple-100 text-purple-800';
        case 'pro': return 'bg-green-100 text-green-800';
        case 'starter': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">User Management</h2>
            <button
              onClick={() => setShowUserModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Business Name</label>
                    <p className="text-gray-900">{selectedUser.business_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Subscription</label>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getSubscriptionBadgeColor(selectedUser.subscription)
                    }`}>
                      {selectedUser.subscription.charAt(0).toUpperCase() + selectedUser.subscription.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isActive ? 'Active' : 'Suspended'}
                      </span>
                      <button
                        onClick={() => updateUserStatus(selectedUser.id, !isActive)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          isActive
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Active</label>
                    <p className="text-gray-900">
                      {new Date(selectedUser.last_active_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Subscription Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Current Period</label>
                    <p className="text-gray-900">
                      {new Date(selectedUser.current_period_start || '').toLocaleDateString()} - {' '}
                      {new Date(selectedUser.current_period_end || '').toLocaleDateString()}
                    </p>
                  </div>
                  {selectedUser.next_billing_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Next Billing Date</label>
                      <p className="text-gray-900">
                        {new Date(selectedUser.next_billing_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Auto-Renew</label>
                    <p className="text-gray-900">
                      {selectedUser.auto_renew ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  {!selectedUser.trial_used ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Trial Status</label>
                      <p className="text-gray-900">
                        {selectedUser.trial_calls_remaining} calls remaining
                      </p>
                    </div>
                  ) : null}
                </div>

                <h3 className="text-lg font-medium mt-6 mb-4">Usage Summary</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Total Calls</label>
                    <p className="text-gray-900">{selectedUser.total_calls || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Remaining Calls</label>
                    <p className="text-gray-900">{selectedUser.calls_remaining || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Rollover Calls</label>
                    <p className="text-gray-900">{selectedUser.rollover_calls || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Settings</h3>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Schedule Time (minutes)
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={minScheduleTime}
                    onChange={(e) => setMinScheduleTime(Math.max(1, parseInt(e.target.value) || 1))}
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={handleMinScheduleTimeUpdate}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Update
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Minimum time required between scheduling and start of a call
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold mt-1">{stats.totalUsers}</p>
            </div>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              {stats.activeUsers} active in last 30 days
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500">Trial Users</p>
              <p className="text-2xl font-semibold mt-1">{stats.trialUsers}</p>
            </div>
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Active trial accounts
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500">Paid Users</p>
              <p className="text-2xl font-semibold mt-1">{stats.paidUsers}</p>
            </div>
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Active paid subscriptions
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500">Total Calls</p>
              <p className="text-2xl font-semibold mt-1">{stats.totalCalls}</p>
            </div>
            <Bell className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Across all users
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-semibold mt-1">${stats.totalRevenue}</p>
            </div>
            <BarChart2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Active subscriptions
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500">Expired Users</p>
              <p className="text-2xl font-semibold mt-1">
                {users.filter(u => u.subscription_status === 'expired').length}
              </p>
            </div>
            <UserX className="w-5 h-5 text-red-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Need renewal
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">User Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const isActive = user.subscription_status === 'active';
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.business_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.subscription === 'enterprise'
                            ? 'bg-purple-100 text-purple-800'
                            : user.subscription === 'pro'
                            ? 'bg-green-100 text-green-800'
                            : user.subscription === 'starter'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)}
                        </span>
                        {!user.trial_used && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({user.trial_calls_remaining} trial calls)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{user.total_calls} total</div>
                        <div className="text-xs text-gray-400">
                          {user.calls_remaining} remaining
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.last_active_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.next_billing_date 
                          ? new Date(user.next_billing_date).toLocaleDateString()
                          : 'N/A'
                        }
                        {user.auto_renew && (
                          <span className="ml-2 text-xs text-green-600">
                            (Auto-renew)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end space-x-2"
                        >
                          <Settings2 className="w-4 h-4" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showUserModal && <UserModal />}
    </div>
  );
};

export default AdminDashboard;