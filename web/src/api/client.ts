import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import { store } from "../store";
import { setServerOnline, setServerOffline } from "../store/serverStatusSlice";

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => {
    store.dispatch(setServerOnline());

    return response;
  },

  (error: AxiosError) => {
    // No response means the server could not be reached.
    if (!error.response) {
      store.dispatch(
        setServerOffline("Server is unavailable. Please try again later."),
      );
    }

    return Promise.reject(error);
  },
);

export async function api<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);

    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

interface ApiError {
  success: false;
  message: string;
  errors?: unknown;
  statusCode?: number;
}

function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.response) {
      return {
        success: false,
        message:
          error.response.data?.message ??
          getDefaultErrorMessage(error.response.status),
        errors: error.response.data?.errors,
        statusCode: error.response.status,
      };
    }

    if (error.request) {
      return {
        success: false,
        message: "Unable to connect to the server.",
      };
    }

    return {
      success: false,
      message: error.message || "Request failed.",
    };
  }

  return {
    success: false,
    message: "Something went wrong.",
  };
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request.";

    case 401:
      return "Unauthorized.";

    case 403:
      return "Access denied.";

    case 404:
      return "Resource not found.";

    case 409:
      return "Conflict with existing data.";

    case 422:
      return "Validation failed.";

    case 500:
      return "Internal server error.";

    default:
      return "Something went wrong.";
  }
}
