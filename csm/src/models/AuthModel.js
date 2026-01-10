import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthModel = {
  // Register player
  register: async (playerData) => {
    try {
      const response = await api.post('/auth/player/register', playerData);
      if (response.data.access_token) {
        await AsyncStorage.setItem('playerToken', response.data.access_token);
        await AsyncStorage.setItem('playerData', JSON.stringify(response.data.player));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login player
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/player/login', { email, password });
      if (response.data.access_token) {
        await AsyncStorage.setItem('playerToken', response.data.access_token);
        await AsyncStorage.setItem('playerData', JSON.stringify(response.data.player));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Logout
  logout: async () => {
    try {
      await AsyncStorage.removeItem('playerToken');
      await AsyncStorage.removeItem('playerData');
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Get stored player data
  getStoredPlayer: async () => {
    try {
      const playerData = await AsyncStorage.getItem('playerData');
      return playerData ? JSON.parse(playerData) : null;
    } catch (error) {
      return null;
    }
  },

  // Check if token exists
  hasToken: async () => {
    try {
      const token = await AsyncStorage.getItem('playerToken');
      return !!token;
    } catch (error) {
      return false;
    }
  },

  verifyRegister: async (email, otp) => {
    try {
      const response = await api.post('/auth/player/verify-register', { email, otp });
      if (response.data.access_token) {
        await AsyncStorage.setItem('playerToken', response.data.access_token);
        await AsyncStorage.setItem('playerData', JSON.stringify(response.data.player));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Verification failed' };
    }
  },

  verifyLogin: async (email, otp) => {
    try {
      const response = await api.post('/auth/player/verify-login', { email, otp });
      if (response.data.access_token) {
        await AsyncStorage.setItem('playerToken', response.data.access_token);
        await AsyncStorage.setItem('playerData', JSON.stringify(response.data.player));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Verification failed' };
    }
  },

  // Request password reset OTP
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/player/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reset OTP' };
    }
  },

  // Verify password reset OTP
  verifyResetOtp: async (email, otp) => {
    try {
      const response = await api.post('/auth/player/verify-reset-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'OTP verification failed' };
    }
  },

  // Reset password with token
  resetPassword: async (email, resetToken, newPassword) => {
    try {
      const response = await api.post('/auth/player/reset-password', { email, resetToken, newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },
};
