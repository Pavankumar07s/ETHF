import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; requiresVerification?: boolean }>;
  register: (email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:3001';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const makeAuthRequest = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return { response, data };
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const { response, data } = await makeAuthRequest('/auth/me');
      
      if (response.ok && data.success) {
        setUser(data.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { response, data } = await makeAuthRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok && data.success) {
        setUser(data.data.user);
        return { success: true, message: data.message };
      } else {
        return {
          success: false,
          message: data.message || 'Login failed',
          requiresVerification: data.requiresVerification,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error during login' };
    }
  };

  const register = async (email: string, password: string, confirmPassword: string) => {
    try {
      const { response, data } = await makeAuthRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      if (response.ok && data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error during registration' };
    }
  };

  const logout = async () => {
    try {
      await makeAuthRequest('/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user anyway on logout error
      setUser(null);
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const { response, data } = await makeAuthRequest('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return {
        success: response.ok && data.success,
        message: data.message || (response.ok ? 'Verification email sent' : 'Failed to send verification email'),
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, message: 'Network error while sending verification email' };
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resendVerification,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};