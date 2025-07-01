import React, { useState, useEffect } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChat } from '../context/ChatContext';

const MessageBubble = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useChat();

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    return !inline && match ? (
      <div className="code-block">
        <div className="code-header">
          <span className="code-language">{language}</span>
          <motion.button
            className="copy-code-btn"
            onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Copy code"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </motion.button>
        </div>
        <SyntaxHighlighter
          style={theme === 'dark' ? oneDark : oneLight}
          language={language}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  };

  return (
    <motion.div 
      className={`message ${message.sender}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`message-avatar-wrapper ${message.sender}`}>
        <motion.div 
          className="message-avatar"
          whileHover={{ scale: 1.05 }}
        >
          {message.sender === 'user' ? (
            <User size={16} />
          ) : (
            <Bot size={16} />
          )}
        </motion.div>
      </div>
      
      <div className="message-content">
        <div className="message-bubble-wrapper">
          <motion.div 
            className="message-bubble"
            whileHover={{ y: -1 }}
          >
            <div className="message-text">
              <ReactMarkdown components={{ code: CodeBlock }}>
                {message.text}
              </ReactMarkdown>
              {message.sender === 'bot' && message.isStreaming && (
                <span className="typing-cursor">|</span>
              )}
            </div>
            
            {message.sender === 'bot' && !message.isStreaming && (
              <div className="message-actions">
                <motion.button
                  className="action-btn"
                  onClick={() => copyToClipboard(message.text)}
                  title="Copy message"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </motion.button>
              </div>
            )}
          </motion.div>
          <div className="message-timestamp">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble; 