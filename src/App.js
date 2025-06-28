import React from 'react';
import './App.css';
import ChatWindow from './components/ChatWindow';
import AuthModal from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <div className="App">
          <ChatWindow />
          <AuthModal />
        </div>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
