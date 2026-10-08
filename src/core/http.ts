import { useAuthStore } from '../modules/auth/store/useAuthStore';

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const fetchJSON = async (url: string, method = "GET", body?: any) => {
  const token = useAuthStore.getState().token;

  const isFormData = body instanceof FormData;

  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw { response: { status: res.status, data } };
  }
  return data;
};