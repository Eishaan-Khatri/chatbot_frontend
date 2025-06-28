import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('chatbot_token');
    const userData = localStorage.getItem('chatbot_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('chatbot_token');
        localStorage.removeItem('chatbot_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Simulate API call - replace with actual authentication
      const response = await simulateLogin(email, password);
      
      if (response.success) {
        const { token, user: userData } = response;
        
        // Store in localStorage
        localStorage.setItem('chatbot_token', token);
        localStorage.setItem('chatbot_user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      // Simulate API call - replace with actual registration
      const response = await simulateSignup(name, email, password);
      
      if (response.success) {
        const { token, user: userData } = response;
        
        // Store in localStorage
        localStorage.setItem('chatbot_token', token);
        localStorage.setItem('chatbot_user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('chatbot_token');
    localStorage.removeItem('chatbot_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const getAuthToken = () => {
    return localStorage.getItem('chatbot_token');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    showAuthModal,
    setShowAuthModal,
    login,
    signup,
    logout,
    getAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Simulated authentication functions - replace with real API calls
const simulateLogin = async (email, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple validation for demo purposes
  if (email === 'demo@example.com' && password === 'password') {
    return {
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        avatar: 'DU'
      }
    };
  } else if (email && password) {
    // Allow any email/password for demo
    const name = email.split('@')[0];
    return {
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: Date.now().toString(),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: email,
        avatar: name.substring(0, 2).toUpperCase()
      }
    };
  } else {
    return {
      success: false,
      error: 'Invalid email or password'
    };
  }
};

const simulateSignup = async (name, email, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (name && email && password) {
    return {
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: Date.now().toString(),
        name: name,
        email: email,
        avatar: name.substring(0, 2).toUpperCase()
      }
    };
  } else {
    return {
      success: false,
      error: 'All fields are required'
    };
  }
}; 