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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Generate bot response
      const fullBotResponse = generateBotResponse(text);
      const botMessageId = Date.now() + 1;
      
      // Create initial empty bot message
      const initialBotMessage = { 
        id: botMessageId, 
        text: '', 
        sender: 'bot', 
        timestamp: new Date().toISOString(),
        isStreaming: true
      };
      
      setIsTyping(false);
      const messagesWithBot = [...newMessages, initialBotMessage];
      setMessages(messagesWithBot);
      
      // Animate text word by word
      const words = fullBotResponse.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        const updatedMessage = {
          ...initialBotMessage,
          text: currentText,
          isStreaming: i < words.length - 1
        };
        
        const updatedMessages = [...newMessages, updatedMessage];
        setMessages(updatedMessages);
        
        // Save after each word for persistence
        if (i === words.length - 1) {
          const finalMessage = { ...updatedMessage, isStreaming: false };
          const finalMessages = [...newMessages, finalMessage];
          setMessages(finalMessages);
          saveHistory(finalMessages, historyKey);
        }
        
        // Delay between words (faster for short words, slower for long words)
        const wordDelay = Math.min(150, Math.max(50, words[i].length * 20));
        await new Promise(resolve => setTimeout(resolve, wordDelay));
      }
      
    } catch (err) {
      setError('Failed to get a response. Please try again.');
      console.error('Error sending message:', err);
      setIsTyping(false);
    }
  };

  // Enhanced bot response generator
  const generateBotResponse = (userText) => {
    const responses = [
      `That's a fascinating question about "${userText}". Let me share some insights on this topic. Based on current understanding, there are several key aspects to consider when approaching this subject.`,
      `I find your inquiry about "${userText}" quite intriguing. This touches on some important concepts that are worth exploring in detail. Let me break this down for you step by step.`,
      `Thank you for asking about "${userText}". This is actually a complex topic with multiple dimensions. I'd be happy to help you understand the various aspects involved here.`,
      `Your question regarding "${userText}" opens up some interesting possibilities for discussion. There are several angles we could explore, each offering unique perspectives on the matter.`,
      `I appreciate you bringing up "${userText}". This subject has been evolving rapidly, and there are some exciting developments worth discussing. Let me walk you through the key points.`,
      `The topic of "${userText}" is quite relevant in today's context. There are practical applications and theoretical considerations that make this an important area to understand thoroughly.`,
      `When it comes to "${userText}", there are both traditional approaches and modern innovations to consider. I'll help you navigate through the essential information you need to know.`,
      `Your interest in "${userText}" is well-placed, as this area has significant implications for various fields. Let me provide you with a comprehensive overview of the current landscape.`,
      `I'm glad you asked about "${userText}". This connects to several broader themes that are worth exploring. Understanding these connections can provide valuable insights.`,
      `The subject of "${userText}" involves some nuanced considerations that are important to address. I'll help clarify the key concepts and their practical applications.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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