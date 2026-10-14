import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

let onUnauthorized: (() => void) | null = null;

/** The AuthProvider registers what happens when the API answers 401 (expired/invalid token). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) onUnauthorized();
    return Promise.reject(error);
  }
);

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface Page<T> {
  data: T[];
  pagination: Pagination;
}

export async function listPage<T>(endpoint: string, page = 1, limit = 10): Promise<Page<T>> {
  const res = await api.get(endpoint, { params: { page, limit } });
  return {
    data: res.data.data ?? [],
    pagination: res.data.pagination ?? { page, limit, total: (res.data.data ?? []).length, total_pages: 1 },
  };
}

/** Human readable message from an API/network error. */
export function errorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  const e = err as AxiosError<{ error?: string; message?: string }>;
  if (e?.response?.data?.error) return e.response.data.error;
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === 'ECONNABORTED') return 'O servidor demorou para responder.';
  if (e?.request && !e.response) return 'Não foi possível conectar ao servidor.';
  return fallback;
}
