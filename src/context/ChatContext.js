import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  const getChatHistoryKey = useCallback(() => {
    return `chat_history_${user?.email || 'anonymous'}`;
  }, [user]);

  const saveHistory = useCallback((msgs, key) => {
      try {
        localStorage.setItem(key, JSON.stringify(msgs));
      } catch (e) {
        console.error("Failed to save chat history:", e);
      }
  }, []);

  useEffect(() => {
    const key = getChatHistoryKey();
    try {
      const storedMessages = localStorage.getItem(key);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
      setMessages([]);
    }
  }, [getChatHistoryKey]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const sendMessage = async (text) => {
    const userMessage = { id: Date.now(), text, sender: 'user', timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const historyKey = getChatHistoryKey();
    saveHistory(newMessages, historyKey);
    setIsTyping(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const botMessage = { id: Date.now() + 1, text: `This is a simulated response to: "${text}"`, sender: 'bot', timestamp: new Date().toISOString() };
      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);
      saveHistory(finalMessages, historyKey);
    } catch (err) {
      setError('Failed to get a response. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(getChatHistoryKey());
  }, [getChatHistoryKey]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'neon-sunset';
      return 'light';
    });
  };

  const retryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'user');
    if (lastUserMessage) {
      setMessages(prev => prev.slice(0, -1));
      sendMessage(lastUserMessage.text);
    }
  };

  const exportChatToFile = useCallback(() => {
    try {
      const chatData = {
        user: user?.email || 'anonymous',
        exportDate: new Date().toISOString(),
        messages: messages,
      };
      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${user?.email || 'anonymous'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting chat:', err);
      alert('Error exporting chat history.');
    }
  }, [messages, user]);

  const importChatFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,text/json';
    input.onchange = (event) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (data?.messages && Array.isArray(data.messages)) {
              const key = getChatHistoryKey();
              setMessages(data.messages);
              saveHistory(data.messages, key);
              alert('Chat history imported successfully.');
            } else {
              alert('Invalid file format.');
            }
          } catch (err) {
            alert('Could not import chat history. The file might be corrupted.');
            console.error('Import error:', err);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [getChatHistoryKey, saveHistory]);

  const value = {
    messages,
    isTyping,
    error,
    theme,
    sendMessage,
    retryLastMessage,
    clearChat,
    toggleTheme,
    setError,
    exportChatToFile,
    importChatFromFile,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Simulated backend functions - replace with real API calls
const sendMessageToBot = async (message, token) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simulate random errors occasionally
  if (Math.random() < 0.1) {
    throw new Error('Network error occurred');
  }

  // Generate a simple bot response
  const responses = [
    "That's an interesting question! Let me think about that for a moment.",
    "I understand what you're asking. Here's my perspective on that topic.",
    "Great question! I'd be happy to help you with that.",
    "I see what you mean. Let me provide you with some information about that.",
    "That's a thoughtful inquiry. Based on what I know, I can tell you that...",
    "Thanks for asking! I think this is an important topic to discuss.",
    "I appreciate your question. Here's what I can share about that subject.",
    "That's definitely worth exploring. From my understanding...",
    "Good point! Let me break this down for you.",
    "I'm glad you brought that up. This is actually quite fascinating because..."
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    success: true,
    message: `${randomResponse} You mentioned: "${message}". This is a simulated response that would normally come from your AI backend. You can replace this with actual API calls to OpenAI, Claude, or your custom AI service.`
  };
};

const simulateLoadChatHistory = async (userId) => {
  // Simulate loading from localStorage or backend
  const savedHistory = localStorage.getItem(`chatbot_history_${userId}`);
  if (savedHistory) {
    try {
      return JSON.parse(savedHistory);
    } catch (error) {
      console.error('Error parsing chat history:', error);
      return [];
    }
  }
  return [];
};

const saveChatHistory = async (newMessages) => {
  // In a real app, this would save to your backend
  // For demo, we'll save to localStorage
  try {
    const userId = JSON.parse(localStorage.getItem('chatbot_user'))?.id;
    if (userId) {
      const existingHistory = await simulateLoadChatHistory(userId);
      const updatedHistory = [...existingHistory, ...newMessages];
      localStorage.setItem(`chatbot_history_${userId}`, JSON.stringify(updatedHistory));
    }
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

const clearChatHistory = async (userId) => {
  try {
    localStorage.removeItem(`chatbot_history_${userId}`);
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
}; 