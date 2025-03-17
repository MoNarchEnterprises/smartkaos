import React, { useState } from 'react';
import { Calendar, Phone, User, Clock, FileText } from 'lucide-react';
import { useVoiceStore } from '../store/voiceStore';

interface ScheduleCallModalProps {
  onClose: () => void;
  onSchedule: (data: {
    phone_number: string;
    contact_name: string;
    voice_agent_id: string;
    start_time: Date;
    timezone: string;
    notes?: string;
  }) => void;
}

const ScheduleCallModal: React.FC<ScheduleCallModalProps> = ({ onClose, onSchedule }) => {
  const { voices } = useVoiceStore();
  const [formData, setFormData] = useState({
    phone_number: '',
    contact_name: '',
    voice_agent_id: '',
    start_time: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert local time to UTC for storage
    const localDate = new Date(formData.start_time);
    
    onSchedule({
      phone_number: formData.phone_number,
      contact_name: formData.contact_name,
      voice_agent_id: formData.voice_agent_id,
      start_time: localDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: formData.notes,
    });
    onClose();
  };

  // Get minimum date-time string in local timezone
  const getMinDateTime = () => {
    const now = new Date();
    // Format the date in local time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Schedule New Call</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="contact_name"
                required
                placeholder="John Smith"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone_number"
                required
                pattern="^\+?[1-9]\d{1,14}$"
                placeholder="+1 (555) 123-4567"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="voice_agent_id" className="block text-sm font-medium text-gray-700 mb-1">
              Voice Agent
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="voice_agent_id"
                required
                value={formData.voice_agent_id}
                onChange={(e) => setFormData({ ...formData, voice_agent_id: e.target.value })}
                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a voice agent</option>
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="datetime-local"
                id="start_time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                min={getMinDateTime()}
                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Times are shown in your local timezone
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes or context for this call..."
                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Schedule Call
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleCallModal;