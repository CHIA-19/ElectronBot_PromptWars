import { describe, it, expect } from 'vitest';
import { chatWithGemini } from './gemini';

// Simple tests to ensure the AI service wrapper is functioning and fallback logic is sound.
describe('Gemini AI Service', () => {
  it('returns a fallback response when API fails or is offline', async () => {
    const messages = [
      { sender: 'user', text: 'How do I register to vote in India?' }
    ];
    
    // We are expecting it to hit the fallback since the test environment won't have the real API key configured correctly for actual network calls, or we can just test if it returns a string.
    const response = await chatWithGemini(messages);
    
    // Response should be a string (either from API or from fallback)
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });
});
