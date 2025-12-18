import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthModel } from '../models/AuthModel';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for stored auth on app load
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const hasToken = await AuthModel.hasToken();
      if (hasToken) {
        const storedPlayer = await AuthModel.getStoredPlayer();
        if (storedPlayer) {
          setPlayer(storedPlayer);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await AuthModel.login(email, password);
      setPlayer(data.player);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (playerData) => {
    try {
      const data = await AuthModel.register(playerData);
      setPlayer(data.player);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await AuthModel.logout();
      setPlayer(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Logout failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        player,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
