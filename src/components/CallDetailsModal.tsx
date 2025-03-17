import React, { useState } from 'react';
import { X, Phone, User, Clock, FileText, Download, Save, Play, StopCircle, XCircle } from 'lucide-react';
import type { Call } from '../types';
import { callExecutor } from '../services/callExecutor';

interface CallDetailsModalProps {
  call: Call;
  onClose: () => void;
  onUpdate: (updatedCall: Call) => void;
}

const CallDetailsModal: React.FC<CallDetailsModalProps> = ({ call, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCall, setEditedCall] = useState(call);
  const [isCallActive, setIsCallActive] = useState(callExecutor.isCallActive(call.id));
  const [isCancelling, setIsCancelling] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date: string | Date | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString();
  };

  const handleSave = () => {
    onUpdate(editedCall);
    setIsEditing(false);
  };

  const handleStartCall = async () => {
    await callExecutor.startCall(call);
    setIsCallActive(true);
  };

  const handleStopCall = () => {
    callExecutor.stopCall(call.id);
    setIsCallActive(false);
  };

  const handleCancelCall = async () => {
    setIsCancelling(true);
    try {
      const updatedCall = {
        ...call,
        status: 'missed' as const,
        notes: `${call.notes ? call.notes + '\n\n' : ''}Call cancelled by user at ${new Date().toLocaleString()}`
      };
      await onUpdate(updatedCall);
      onClose();
    } catch (error) {
      console.error('Error cancelling call:', error);
      setIsCancelling(false);
    }
  };

  const canCancel = call.status === 'scheduled' && new Date(call.start_time) > new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Call Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm">Contact Name</span>
              </div>
              <div className="relative">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedCall.contact_name || ''}
                    onChange={(e) => setEditedCall({
                      ...editedCall,
                      contact_name: e.target.value
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter contact name"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{editedCall.contact_name || 'Unknown'}</p>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-sm">Phone Number</span>
              </div>
              <p className="text-gray-900 font-medium">{call.phone_number}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Duration</span>
              </div>
              <p className="text-gray-900 font-medium">{formatDuration(call.duration)}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm">Voice Agent</span>
              </div>
              <p className="text-gray-900 font-medium">{call.voice_agent_id}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Start Time</span>
              </div>
              <p className="text-gray-900 font-medium">
                {formatDateTime(call.start_time)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Notes</span>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  Edit Notes
                </button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editedCall.notes || ''}
                onChange={(e) => setEditedCall({
                  ...editedCall,
                  notes: e.target.value
                })}
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Add notes about the call..."
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                {editedCall.notes || 'No notes available'}
              </p>
            )}
          </div>

          {call.transcription && (
            <div>
              <div className="flex items-center space-x-2 text-gray-500 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Transcription</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{call.transcription}</p>
              </div>
            </div>
          )}

          {call.recording_url && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Recording</span>
                </div>
                <a
                  href={call.recording_url}
                  download
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Download</span>
                </a>
              </div>
              <audio
                controls
                className="w-full mt-2"
                src={call.recording_url}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {call.status === 'scheduled' && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleStartCall}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Start Call</span>
              </button>
              {canCancel && (
                <button
                  onClick={handleCancelCall}
                  disabled={isCancelling}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <XCircle className="w-5 h-5" />
                  <span>{isCancelling ? 'Cancelling...' : 'Cancel Call'}</span>
                </button>
              )}
            </div>
          )}

          {call.status === 'in-progress' && (
            <div className="flex justify-center">
              <button
                onClick={handleStopCall}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <StopCircle className="w-5 h-5" />
                <span>End Call</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 p-4 bg-gray-50 rounded-b-lg">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setEditedCall(call);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallDetailsModal;