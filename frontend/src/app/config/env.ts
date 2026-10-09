import { Capacitor } from '@capacitor/core';

const fallbackRemoteApi = 'https://api-juicios-evaluativos-jp.adsoproject.dev';

function resolveApiUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (Capacitor.isNativePlatform()) {
    return fallbackRemoteApi;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }

  return fallbackRemoteApi;
}

export const config = {
  apiUrl: resolveApiUrl(),
};
