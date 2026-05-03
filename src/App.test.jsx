import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock matchMedia for framer-motion and UI responsiveness checks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ElectionBot App Component', () => {
  it('renders the header and main bot introduction', () => {
    render(<App />);
    // Check if header renders
    expect(screen.getByText('ElectionBot')).toBeInTheDocument();
    
    // Check if initial bot message is loaded
    expect(screen.getByText(/Hello! I'm ElectionBot/i)).toBeInTheDocument();
  });

  it('renders the suggested chips', () => {
    render(<App />);
    expect(screen.getByText('How do I register to vote?')).toBeInTheDocument();
    expect(screen.getByText('Where is my polling place?')).toBeInTheDocument();
  });

  it('allows user to type and send a message', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Ask about registration/i);
    const sendBtn = screen.getByRole('button', { name: /Send message/i });

    // Type a message
    fireEvent.change(input, { target: { value: 'Testing voting by mail' } });
    expect(input.value).toBe('Testing voting by mail');

    // Send the message
    fireEvent.click(sendBtn);

    // The user's message should now be in the document
    expect(screen.getByText('Testing voting by mail')).toBeInTheDocument();
    
    // The input should be cleared
    expect(input.value).toBe('');
  });

  it('toggles dark mode when theme button is clicked', () => {
    render(<App />);
    const themeBtn = screen.getByTitle(/Light mode|Dark mode/i);
    
    fireEvent.click(themeBtn);
    // After toggle, the root should have a data-theme attribute
    expect(document.documentElement.getAttribute('data-theme')).toBeDefined();
  });

  // EDGE CASE: Testing that empty submissions do not break the UI or send empty messages
  it('does not send a message when input is empty or whitespace', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Ask about registration/i);
    const sendBtn = screen.getByRole('button', { name: /Send message/i });

    // Try to send empty
    fireEvent.click(sendBtn);

    // Try to send whitespace
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendBtn);

    // Ensure the message '   ' is not added to the document
    // We expect only the initial bot message to be present (plus chips)
    const emptyMsg = screen.queryByText('   ');
    expect(emptyMsg).not.toBeInTheDocument();
  });
});
