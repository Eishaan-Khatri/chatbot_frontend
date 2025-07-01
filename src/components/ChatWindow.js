import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Sun, Moon, User, Trash2, Settings, Download, RefreshCw, X, Upload, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatWindow = () => {
  const { user, isAuthenticated, setShowAuthModal, logout } = useAuth();
  const { messages, isTyping, error, theme, sendMessage, retryLastMessage, clearChat, toggleTheme, setError, exportChatToFile, importChatFromFile } = useChat();
  
  const [inputText, setInputText] = useState('');
  const [micState, setMicState] = useState('idle'); // 'idle', 'permission', 'recognizing', 'stopping', 'error'
  const recognitionRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Clean up any active recognition on unmount
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);
  
  const handleMicClick = useCallback(() => {
    if (micState === 'recognizing') {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setMicState('stopping');
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMicState('error');
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = 'en-US';
    recognition.continuous = false; // Stop after a pause in speech
    recognition.interimResults = true;

    recognition.onstart = () => {
      setMicState('recognizing');
    };
    
    recognition.onend = () => {
      setMicState('idle');
      recognitionRef.current = null;
    };
    
    recognition.onresult = (event) => {
      let final_transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        final_transcript += event.results[i][0].transcript;
      }
      setInputText(prev => prev + final_transcript);
    };

    recognition.onerror = (event) => {
      console.error("Mic Error:", event.error);
      setMicState('error');
      recognitionRef.current = null;
      
      if (event.error === 'not-allowed') {
        alert("Microphone permission denied. Please enable it in your browser's site settings.");
      } else if (event.error === 'audio-capture' || event.error === 'no-speech') {
        // Less intrusive alert for common, non-blocking errors
      } else {
        alert(`An error occurred with the microphone: ${event.error}`);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      if (err instanceof DOMException && err.name === 'InvalidStateError') {
        // This can happen if start() is called when not idle.
        // The new logic should prevent this, but as a safeguard:
        recognitionRef.current = null;
        setMicState('idle');
      } else {
        setMicState('error');
      }
    }
  }, [micState]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !isAuthenticated) {
      if (!isAuthenticated) setShowAuthModal(true);
      return;
    }
    sendMessage(inputText.trim());
    setInputText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      clearChat();
      setShowUserMenu(false);
    }
  };

  const handleExportChat = () => {
    exportChatToFile();
    setShowUserMenu(false);
  };

  const handleImportChat = () => {
    importChatFromFile();
    setShowUserMenu(false);
  };

  const getContextualSuggestions = () => {
    if (messages.length === 0) {
      return [
        "Tell me about artificial intelligence",
        "Help me write a professional email", 
        "Explain quantum computing simply"
      ];
    }

    // Analyze recent conversation context
    const recentMessages = messages.slice(-6); // Last 6 messages
    const conversationText = recentMessages.map(m => m.text).join(' ').toLowerCase();
    
    // Define context-based suggestions
    const contextSuggestions = {
      technology: [
        "What are the latest trends in this field?",
        "How can I implement this practically?",
        "What are the potential challenges?"
      ],
      business: [
        "What are the business implications?",
        "How can this improve productivity?",
        "What's the ROI on this approach?"
      ],
      education: [
        "Can you explain this in simpler terms?",
        "What are some real-world examples?",
        "How can I learn more about this?"
      ],
      creative: [
        "Can you help me brainstorm ideas?",
        "What are some creative approaches?",
        "How can I make this more engaging?"
      ],
      problem_solving: [
        "What are alternative solutions?",
        "How can I troubleshoot this?",
        "What steps should I take next?"
      ],
      general: [
        "Can you elaborate on that?",
        "What else should I know?",
        "How does this relate to other topics?"
      ]
    };

    // Detect context keywords
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
      const matches = keywords.filter(keyword => conversationText.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedContext = context;
      }
    });

    return contextSuggestions[detectedContext] || contextSuggestions.general;
  };

  const suggestedPrompts = getContextualSuggestions();

  return (
    <motion.div 
      className="chat-window"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="chat-header">
        <div className="chat-title-wrapper">
          <div className="chat-title">AI Chat Assistant</div>
          <div className="status-indicator">
            <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="header-actions">
          <motion.button className="theme-toggle" onClick={toggleTheme} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'neon sunset' : 'light'} mode`}
          >
            {theme === 'light' && <Moon size={20} />}
            {theme === 'dark' && <Sun size={20} />}
            {theme === 'neon-sunset' && <Zap size={20} />}
          </motion.button>
          
          {isAuthenticated ? (
            <div className="user-menu" ref={userMenuRef}>
              <motion.button className="user-menu-btn" onClick={() => setShowUserMenu(v => !v)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <div className="message-avatar">{user?.avatar || user?.name?.charAt(0).toUpperCase() || 'U'}</div>
              </motion.button>
              
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    className="user-menu-dropdown"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="user-info">
                      <div className="user-name">{user?.name}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                    <motion.button onClick={handleExportChat} className="menu-item" whileHover={{ x: 2 }}><Download size={16} />Export Chat</motion.button>
                    <motion.button onClick={handleImportChat} className="menu-item" whileHover={{ x: 2 }}><Upload size={16} />Import Chat</motion.button>
                    <motion.button onClick={handleClearChat} className="menu-item" whileHover={{ x: 2 }}><Trash2 size={16} />Clear Chat</motion.button>
                    <motion.button onClick={() => alert("Settings coming soon!")} className="menu-item" whileHover={{ x: 2 }}><Settings size={16} />Settings</motion.button>
                    <motion.button onClick={logout} className="menu-item" whileHover={{ x: 2 }}><User size={16} />Logout</motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button className="user-menu-btn" onClick={() => setShowAuthModal(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <User size={20} />
            </motion.button>
          )}
        </div>
      </div>

      <div className="messages-container">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div className="welcome-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2>Welcome to AI Chat Assistant!</h2>
              <p>Start a conversation below or try a suggested prompt.</p>
              {!isAuthenticated && (
                <p>
                  <button onClick={() => setShowAuthModal(true)} className="auth-link">Login or Sign up</button> to save your history.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
              className={`message-container-wrapper ${message.sender}`}
            >
              <MessageBubble message={message} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        <AnimatePresence>
          {isTyping && <TypingIndicator />}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div className="error-message" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}>
            <span>{error}</span>
            <div className="error-actions">
              <button onClick={retryLastMessage} className="retry-button"><RefreshCw size={14} /> Retry</button>
              <button onClick={() => setError(null)} className="retry-button"><X size={14} /> Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="suggestions-area" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="suggested-prompts-fixed">
          {suggestedPrompts.map((prompt, index) => (
            <motion.button 
              key={`${prompt}-${index}-${messages.length}`} 
              className="prompt-button-fixed" 
              onClick={() => setInputText(prompt)} 
              whileHover={{ y: -1, scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div className="input-area" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              className="message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={micState === 'recognizing' ? 'Listening...' : (isAuthenticated ? "Type a message..." : "Login to start chatting...")}
              disabled={isTyping || !isOnline || micState === 'permission' || micState === 'stopping'}
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          
          <motion.button
            className={`mic-button ${micState === 'recognizing' ? 'recording' : ''}`}
            onClick={handleMicClick}
            disabled={isTyping || !isOnline || micState === 'permission' || micState === 'stopping'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={
              {
                idle: 'Start voice input',
                permission: 'Waiting for permission...',
                recognizing: 'Stop recording',
                stopping: 'Processing...',
                error: 'Mic error, click to retry',
              }[micState]
            }
          >
            <Mic size={20} />
          </motion.button>
          
          <motion.button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping || !isOnline || micState === 'permission' || micState === 'stopping'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={20} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatWindow; 