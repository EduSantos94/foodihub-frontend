import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSignout: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = React.useReducer(
    (prevState: any, action: any) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.payload,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload.token,
            user: action.payload.user,
            error: null,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
            user: null,
          };
        case 'SET_ERROR':
          return {
            ...prevState,
            error: action.payload,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      user: null,
      error: null,
    }
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Restaurar token do AsyncStorage
        const token = await AsyncStorage.getItem('userToken');
        dispatch({ type: 'RESTORE_TOKEN', payload: token });
      } catch (e) {
        console.error('Erro ao restaurar token:', e);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    user: state.user,
    token: state.userToken,
    isLoading: state.isLoading,
    isSignout: state.isSignout,
    error: state.error,
    signIn: async (email: string, password: string) => {
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333';
        const response = await axios.post(
          `${API_URL}/auth/login`,
          { email, password }
        );

        const { access_token: token, user } = response.data.data;

        // Armazenar token
        await AsyncStorage.setItem('userToken', token);

        dispatch({
          type: 'SIGN_IN',
          payload: { token, user },
        });
      } catch (error: any) {
        const message = error.response?.data?.error || 'Falha no login';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw new Error(message);
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        dispatch({ type: 'SIGN_OUT' });
      } catch (error) {
        console.error('Erro ao deslogar:', error);
      }
    },
  };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
