import { api } from "./client";

export interface RegisterRequest {
  memberCode: string;
  name: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export function registerMember(data: RegisterRequest) {
  return api<RegisterResponse>({
    method: "POST",
    url: "/auth/register",
    data,
  });
}
