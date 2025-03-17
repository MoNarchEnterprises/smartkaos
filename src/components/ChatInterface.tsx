import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic2, StopCircle, Mic, WifiOff } from 'lucide-react';
import { VoiceProfile } from '../types';
import { GeminiService } from '../services/gemini';
import { ElevenLabsService } from '../services/elevenlabs';
import { GEMINI_CONFIG } from '../config/gemini';
import { ELEVENLABS_CONFIG } from '../config/elevenlabs';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface ChatInterfaceProps {
  voice: VoiceProfile;
  onClose: () => void;
}

const gemini = new GeminiService(GEMINI_CONFIG.API_KEY);
const elevenlabs = new ElevenLabsService(ELEVENLABS_CONFIG.API_KEY);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ voice, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>(navigator.onLine ? 'online' : 'offline');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network is online');
      setNetworkStatus('online');
    };

    const handleOffline = () => {
      console.log('Network is offline');
      setNetworkStatus('offline');
      stopRecording();
      
      const message: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: 'Network connection lost. Voice input is temporarily unavailable.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const greeting: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text: `Hello! I'm ${voice.name}. ${voice.personality || 'How can I help you today?'}`,
      sender: 'agent',
      timestamp: new Date(),
    };
    setMessages([greeting]);

    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setMicPermission(result.state);
        result.onchange = () => setMicPermission(result.state);
      })
      .catch(() => {
        setMicPermission('prompt');
      });

    return () => {
      stopRecording();
    };
  }, [voice.name, voice.personality]);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      toggleRecording();
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermission('denied');
      const message: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: 'Microphone access was denied. Please enable microphone access in your browser settings to use voice input.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
    }
  };

  const startRecording = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported');
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'network') {
          const message: Message = {
            id: Math.random().toString(36).substr(2, 9),
            text: 'Network error occurred. Please check your connection and try again.',
            sender: 'agent',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, message]);
        }
        stopRecording();
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          const finalTranscript = input.trim();
          if (finalTranscript) {
            handleSubmit(new Event('submit') as any);
          }
          setIsRecording(false);
        }
      };

      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      const message: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: 'Voice recording is not supported in your browser. Please type your message instead.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (networkStatus === 'offline') {
      const message: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: 'Voice input is not available while offline. Please check your internet connection.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
      return;
    }

    if (micPermission === 'denied') {
      const message: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: 'Microphone access is blocked. Please enable it in your browser settings.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
      return;
    }

    if (micPermission === 'prompt') {
      requestMicrophonePermission();
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await gemini.generateResponse(input.trim(), voice, voice.contactName);
      
      const agentMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: response,
        sender: 'agent',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentMessage]);

      if (voice.voiceId) {
        setIsSpeaking(true);
        await elevenlabs.previewVoice(response, voice.voiceId, voice.settings);
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSpeaking = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSpeaking(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Mic2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{voice.name}</h2>
              <p className="text-sm text-gray-500">AI Voice Agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p>{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? 'Recording...' : 'Type your message...'}
              className="flex-1 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading || isRecording}
            />
            {networkStatus === 'offline' && (
              <div className="text-red-500 flex items-center">
                <WifiOff className="w-5 h-5" />
              </div>
            )}
            <button
              type="button"
              onClick={toggleRecording}
              disabled={networkStatus === 'offline'}
              className={`p-2 rounded-lg ${
                isRecording
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : networkStatus === 'offline'
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : micPermission === 'denied'
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              title={
                networkStatus === 'offline'
                  ? 'Voice input unavailable while offline'
                  : micPermission === 'denied'
                  ? 'Microphone access is blocked'
                  : isRecording
                  ? 'Stop recording'
                  : 'Start recording'
              }
            >
              <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
            </button>
            {isSpeaking ? (
              <button
                type="button"
                onClick={stopSpeaking}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`p-2 ${
                  isLoading || !input.trim()
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-indigo-600 hover:text-indigo-700'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;