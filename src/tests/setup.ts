import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Define handlers
const handlers = [
  // Mock Supabase API calls
  http.all('*/rest/v1/*', () => {
    return HttpResponse.json({ data: [], error: null });
  }),
  
  // Mock ElevenLabs API calls
  http.all('*/v1/*', () => {
    return HttpResponse.json({ success: true });
  }),
  
  // Mock Gemini API calls
  http.all('*/v1beta/models/gemini-pro:generateContent', () => {
    return HttpResponse.json({ 
      candidates: [{ content: { parts: [{ text: 'Test response' }] } }]
    });
  })
];

// Create MSW server
export const server = setupServer(...handlers);

// Mock window.crypto for webhook secret generation
const cryptoMock = {
  getRandomValues: (arr: Uint8Array) => arr.map((_, i) => i % 256),
  subtle: {
    digest: vi.fn()
  }
};

// Mock window.Audio
class AudioMock {
  play() { return Promise.resolve(); }
  pause() {}
}

beforeAll(() => {
  // Start MSW server
  server.listen();

  // Setup global mocks
  global.crypto = cryptoMock as unknown as Crypto;
  global.Audio = AudioMock as any;
  
  // Mock WebRTC APIs
  global.RTCPeerConnection = vi.fn();
  global.MediaStream = vi.fn();
  
  // Mock Web Audio API
  global.AudioContext = vi.fn();
  global.AudioBuffer = vi.fn();
  
  // Mock Speech Recognition
  global.SpeechRecognition = vi.fn();
  global.webkitSpeechRecognition = vi.fn();

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn();
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup(); // Clean up after each test
  vi.clearAllMocks(); // Clear all mocks
  server.resetHandlers(); // Reset MSW request handlers
});

afterAll(() => {
  server.close(); // Close MSW server
});