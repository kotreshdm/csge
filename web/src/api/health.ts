import { api } from "./client";

export interface HealthResponse {
  success: boolean;
  message: string;
}

export function getHealth() {
  return api<HealthResponse>({
    url: "/health",
  });
}
