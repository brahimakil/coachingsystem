import api from './api';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    uid: string;
    email: string;
    displayName: string;
    token: string;
    role: string;
    status: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    uid: string;
    email: string;
    status: string;
  };
}

export const authService = {
  async login(credentials: any): Promise<LoginResponse> {
    const response = await api.post('/auth/coach/login', credentials);
    return response.data;
  },

  async register(data: any): Promise<RegisterResponse> {
    const response = await api.post('/auth/coach/register', data);
    return response.data;
  },

  logout() {
    localStorage.removeItem('coachToken');
    localStorage.removeItem('coachUser');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('coachUser');
    if (userStr) return JSON.parse(userStr);
    return null;
  },
};
