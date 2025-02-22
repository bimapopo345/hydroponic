// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// API Endpoints
export const ENDPOINTS = {
  sensor: {
    latest: "/api/sensor-data/:userId/latest",
    history: "/api/sensor-data/:userId/history",
    stats: "/api/sensor-data/:userId/stats",
  },
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
  },
};

// Helper function untuk membuat URL dengan parameter
export const createUrl = (
  endpoint: string,
  params: Record<string, string> = {}
): string => {
  let url = endpoint;
  Object.keys(params).forEach((key) => {
    url = url.replace(`:${key}`, params[key]);
  });
  return `${API_BASE_URL}${url}`;
};

// Helper function untuk fetch dengan error handling
export const fetchApi = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Example usage:
/*
import { createUrl, fetchApi, ENDPOINTS } from './config/api';

// Get latest sensor data
const getLatestData = async (userId: string) => {
    const url = createUrl(ENDPOINTS.sensor.latest, { userId });
    return await fetchApi(url);
};

// Get sensor history
const getHistory = async (userId: string) => {
    const url = createUrl(ENDPOINTS.sensor.history, { userId });
    return await fetchApi(url);
};

// Post data
const postData = async (endpoint: string, data: any) => {
    return await fetchApi(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};
*/
