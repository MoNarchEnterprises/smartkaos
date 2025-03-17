import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, BarChart2, User, PhoneCall, PhoneOff, VoicemailIcon as VoiceMailIcon, Mic2, Volume2, VolumeX } from 'lucide-react';
import type { Call, VoiceProfile } from '../types';
import { useVoiceStore } from '../store/voiceStore';
import CallDetailsModal from '../components/CallDetailsModal';
import ScheduleCallModal from '../components/ScheduleCallModal';
import { supabase } from '../services/supabase';

const CallCenter: React.FC = () => {
  const { voices } = useVoiceStore();
  const [activeTab, setActiveTab] = useState<'current' | 'scheduled' | 'history'>('current');
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState({
    activeCalls: 0,
    scheduledToday: 0,
    avgDuration: '0:00',
    successRate: '0%'
  });

  useEffect(() => {
    const loadCalls = async () => {
      if (!supabase) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('calls')
          .select('*')
          .order('start_time', { ascending: true });

        if (error) throw error;
        setCalls(data || []);
        updateStats(data || []);
      } catch (error) {
        console.error('Error loading calls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  }, []);

  const updateStats = (currentCalls: Call[] = calls) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const activeCalls = currentCalls.filter(call => call.status === 'in-progress').length;
    const scheduledToday = currentCalls.filter(call => {
      const callDate = new Date(call.start_time);
      return call.status === 'scheduled' && 
             callDate >= startOfDay &&
             callDate < endOfDay;
    }).length;

    const completedCalls = currentCalls.filter(call => call.status === 'completed');
    const totalDuration = completedCalls.reduce((acc, call) => acc + (call.duration || 0), 0);
    const avgDuration = completedCalls.length > 0 
      ? Math.floor(totalDuration / completedCalls.length)
      : 0;

    const successRate = completedCalls.length > 0
      ? ((completedCalls.length / currentCalls.length) * 100).toFixed(1)
      : '0';

    setStats({
      activeCalls,
      scheduledToday,
      avgDuration: formatDuration(avgDuration),
      successRate: `${successRate}%`
    });
  };

  const handleUpdateCall = async (updatedCall: Call) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('calls')
        .update(updatedCall)
        .eq('id', updatedCall.id);

      if (error) throw error;
      
      setCalls(calls.map(call => 
        call.id === updatedCall.id ? updatedCall : call
      ));
      updateStats();
    } catch (error) {
      console.error('Error updating call:', error);
    }
  };

  const handleScheduleCall = async (data: {
    phone_number: string;
    contact_name: string;
    voice_agent_id: string;
    start_time: Date;
    timezone: string;
    notes?: string;
  }) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('calls')
        .insert([{
          ...data,
          status: 'scheduled'
        }]);

      if (error) throw error;

      // Refresh calls after scheduling
      const { data: updatedCalls, error: fetchError } = await supabase
        .from('calls')
        .select('*')
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;
      
      setCalls(updatedCalls || []);
      updateStats(updatedCalls || []);
      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error('Error scheduling call:', error);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (number: string) => {
    return number;
  };

  const getStatusColor = (status: Call['status']) => {
    switch (status) {
      case 'in-progress':
        return 'text-green-600 bg-green-50';
      case 'scheduled':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-gray-600 bg-gray-50';
      case 'missed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: Call['status']) => {
    switch (status) {
      case 'in-progress':
        return PhoneCall;
      case 'scheduled':
        return Calendar;
      case 'completed':
        return PhoneOff;
      case 'missed':
        return VoiceMailIcon;
      default:
        return Phone;
    }
  };

  const tabs = [
    { id: 'current', label: 'Current Calls', icon: Phone },
    { id: 'scheduled', label: 'Scheduled', icon: Calendar },
    { id: 'history', label: 'Call History', icon: Clock },
  ];

  const filteredCalls = calls.filter(call => {
    const now = new Date();
    
    switch (activeTab) {
      case 'current':
        return call.status === 'in-progress';
      case 'scheduled':
        return call.status === 'scheduled' && new Date(call.start_time) >= now;
      case 'history':
        return call.status === 'completed' || call.status === 'missed' || 
               (call.status === 'scheduled' && new Date(call.start_time) < now);
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort by start time, with current and future calls ascending and past calls descending
    const aDate = new Date(a.start_time);
    const bDate = new Date(b.start_time);
    const now = new Date();
    
    if (aDate >= now && bDate >= now) {
      // Future calls: ascending order
      return aDate.getTime() - bDate.getTime();
    } else if (aDate < now && bDate < now) {
      // Past calls: descending order
      return bDate.getTime() - aDate.getTime();
    } else {
      // Mixed past and future: future first, then past
      return aDate >= now ? -1 : 1;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading calls...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Call Center</h1>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          onClick={() => setIsScheduleModalOpen(true)}
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule Call</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Active Calls</p>
              <p className="text-2xl font-semibold mt-1">{stats.activeCalls}</p>
            </div>
            <PhoneCall className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              {stats.activeCalls > 0 ? 'Calls in progress' : 'No active calls'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Scheduled Today</p>
              <p className="text-2xl font-semibold mt-1">{stats.scheduledToday}</p>
            </div>
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Upcoming calls today
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Avg. Duration</p>
              <p className="text-2xl font-semibold mt-1">{stats.avgDuration}</p>
            </div>
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Per completed call
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Success Rate</p>
              <p className="text-2xl font-semibold mt-1">{stats.successRate}</p>
            </div>
            <BarChart2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Completed calls
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-4" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCalls.map((call) => {
                  const StatusIcon = getStatusIcon(call.status);
                  const voice = voices.find(v => v.id === call.voice_agent_id);
                  const callTime = new Date(call.start_time);
                  const isUpcoming = callTime > new Date();
                  
                  return (
                    <tr key={call.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-sm ${getStatusColor(call.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="capitalize">{call.status.replace('-', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {call.contact_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatPhoneNumber(call.phone_number)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Mic2 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="ml-2 text-gray-900">{voice?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                        {callTime.toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                        {isUpcoming && call.timezone && (
                          <div className="text-xs text-gray-500">
                            ({call.timezone})
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                        {formatDuration(call.duration)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {call.status === 'in-progress' ? (
                          <div className="flex items-center space-x-2">
                            <Volume2 className="w-4 h-4 text-green-600 animate-pulse" />
                            <div className="flex space-x-1">
                              <div className="w-1 h-4 bg-green-600 animate-pulse" style={{ animationDelay: '0ms' }} />
                              <div className="w-1 h-4 bg-green-600 animate-pulse" style={{ animationDelay: '100ms' }} />
                              <div className="w-1 h-4 bg-green-600 animate-pulse" style={{ animationDelay: '200ms' }} />
                            </div>
                          </div>
                        ) : (
                          <VolumeX className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => setSelectedCall(call)}
                        >
                          View Details
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

      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
          onUpdate={handleUpdateCall}
        />
      )}

      {isScheduleModalOpen && (
        <ScheduleCallModal
          onClose={() => setIsScheduleModalOpen(false)}
          onSchedule={handleScheduleCall}
        />
      )}
    </div>
  );
};

export default CallCenter;