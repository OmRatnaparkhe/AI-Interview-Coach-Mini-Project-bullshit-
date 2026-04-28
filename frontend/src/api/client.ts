import axios from "axios";
import type { GetToken } from "@clerk/types";

let getToken: GetToken | null = null;

export function setClerkTokenGetter(fn: GetToken) {
  getToken = fn;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use(async (config) => {
  if (!getToken) return config;
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (!config.headers.Accept) {
      config.headers.Accept = 'application/json';
    }
    
    const isFormData = config.data instanceof FormData;
    if (!config.headers['Content-Type'] && !isFormData) {
      config.headers['Content-Type'] = 'application/json';
    }
  }
  return config;
});

