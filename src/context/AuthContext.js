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
  
  // Get registered users from localStorage
  const registeredUsers = JSON.parse(localStorage.getItem('chatbot_registered_users') || '{}');
  
  // Check if user exists and password matches
  if (registeredUsers[email] && registeredUsers[email].password === password) {
    return {
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: registeredUsers[email].id,
        name: registeredUsers[email].name,
        email: email,
        avatar: registeredUsers[email].avatar
      }
    };
  } else if (email && password) {
    return {
      success: false,
      error: 'Invalid email or password. Please check your credentials or sign up if you don\'t have an account.'
    };
  } else {
    return {
      success: false,
      error: 'Email and password are required'
    };
  }
};

const simulateSignup = async (name, email, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (!name || !email || !password) {
    return {
      success: false,
      error: 'All fields are required'
    };
  }

  // Get registered users from localStorage
  const registeredUsers = JSON.parse(localStorage.getItem('chatbot_registered_users') || '{}');
  
  // Check if user already exists
  if (registeredUsers[email]) {
    return {
      success: false,
      error: 'An account with this email already exists. Please login instead.'
    };
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    name: name,
    password: password, // In real app, this would be hashed
    avatar: name.substring(0, 2).toUpperCase()
  };

  // Save to registered users
  registeredUsers[email] = newUser;
  localStorage.setItem('chatbot_registered_users', JSON.stringify(registeredUsers));

  return {
    success: true,
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: newUser.id,
      name: newUser.name,
      email: email,
      avatar: newUser.avatar
    }
  };
}; 