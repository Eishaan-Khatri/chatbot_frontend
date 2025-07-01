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
      const fullBotResponse = generateBotResponse(text, messages);
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
  const generateBotResponse = (userText, conversationHistory = []) => {
    const recentMessages = conversationHistory.slice(-4);
    const conversationContext = recentMessages.map(m => m.text).join(' ').toLowerCase();
    
    // Analyze context and generate appropriate responses
    const contextualResponses = {
      technology: [
        `Regarding "${userText}" in the tech space, this is quite fascinating. The technological landscape is constantly evolving, and this particular area has seen significant advancements recently. Let me share some insights on the current state and future possibilities.`,
        `Your question about "${userText}" touches on some cutting-edge technology concepts. From a technical perspective, there are several approaches and methodologies that are particularly relevant here. I'll break down the key technical aspects for you.`,
        `The technology behind "${userText}" is quite sophisticated. There are both established practices and emerging innovations in this field. Understanding the technical foundations will help you grasp the broader implications and potential applications.`
      ],
      business: [
        `From a business standpoint, "${userText}" presents interesting opportunities and challenges. Market dynamics, competitive advantages, and strategic positioning all play crucial roles here. Let me outline the key business considerations.`,
        `Your inquiry about "${userText}" has significant business implications. ROI, scalability, and market adoption are critical factors to consider. I'll help you understand the business case and potential impact.`,
        `In the business context of "${userText}", there are several strategic approaches worth exploring. Cost-benefit analysis, implementation timelines, and organizational change management are all important factors to consider.`
      ],
      education: [
        `Great question about "${userText}"! Let me break this down in a way that's easy to understand. I'll start with the fundamentals and build up to more complex concepts, providing examples along the way.`,
        `I'd be happy to explain "${userText}" in detail. Learning about this topic involves understanding several key concepts. Let me walk you through each component step by step.`,
        `Your interest in "${userText}" is excellent for learning purposes. This topic connects to many other areas of knowledge, and I'll help you see those connections while explaining the core concepts.`
      ],
      creative: [
        `"${userText}" opens up so many creative possibilities! There are numerous innovative approaches we could explore here. Let me share some creative strategies and out-of-the-box thinking that could be applied.`,
        `I love the creative aspect of "${userText}"! This is where imagination meets practical application. There are several artistic and innovative directions we could take this concept.`,
        `Your creative inquiry about "${userText}" is inspiring! The intersection of creativity and functionality often leads to the most interesting solutions. Let me suggest some creative approaches and techniques.`
      ],
      problem_solving: [
        `I understand you're looking for solutions regarding "${userText}". Let's approach this systematically. I'll help you identify the root causes and explore various problem-solving methodologies that could be effective here.`,
        `Problem-solving around "${userText}" requires a structured approach. Let me guide you through different strategies and help you evaluate which solutions might work best for your specific situation.`,
        `When it comes to resolving issues with "${userText}", there are several troubleshooting techniques we can employ. I'll help you work through this step by step with practical solutions.`
      ],
      general: [
        `That's an interesting question about "${userText}". This topic has multiple dimensions worth exploring. Let me provide you with a comprehensive overview that covers the key aspects and their interconnections.`,
        `Your inquiry about "${userText}" touches on several important points. I'll help you understand the broader context and how this relates to other relevant topics you might find interesting.`,
        `Thanks for asking about "${userText}". This subject offers rich opportunities for discussion. Let me share insights that will give you a well-rounded understanding of the topic.`
      ]
    };

    // Detect context keywords (same as in ChatWindow)
    const contexts = {
      technology: ['ai', 'artificial intelligence', 'tech', 'software', 'programming', 'code', 'algorithm', 'data', 'computer', 'digital', 'automation', 'machine learning', 'development'],
      business: ['business', 'company', 'market', 'sales', 'revenue', 'profit', 'strategy', 'management', 'productivity', 'efficiency', 'growth', 'customer', 'service'],
      education: ['learn', 'study', 'education', 'school', 'university', 'course', 'tutorial', 'explain', 'understand', 'knowledge', 'teach', 'research', 'academic'],
      creative: ['creative', 'design', 'art', 'writing', 'content', 'marketing', 'brand', 'idea', 'innovation', 'brainstorm', 'inspiration', 'visual', 'story'],
      problem_solving: ['problem', 'issue', 'solve', 'fix', 'error', 'bug', 'troubleshoot', 'help', 'solution', 'resolve', 'debug', 'challenge', 'difficulty']
    };

    // Find the most relevant context
    let maxMatches = 0;
    let detectedContext = 'general';
    
    Object.entries(contexts).forEach(([context, keywords]) => {
      const matches = keywords.filter(keyword => 
        conversationContext.includes(keyword) || userText.toLowerCase().includes(keyword)
      ).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedContext = context;
      }
    });

    const responses = contextualResponses[detectedContext] || contextualResponses.general;
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