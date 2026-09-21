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

export function registerUser(data: RegisterRequest) {
  return api<RegisterResponse>({
    method: "POST",
    url: "/auth/register",
    data,
  });
}

export interface LoginRequest {
  memberCode: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    member: {
      memberId: string;
      memberCode: string;
      name: string;
      memberType: string;
    };
  };
}

export function loginUser(data: LoginRequest) {
  return api<LoginResponse>({
    method: "POST",
    url: "/auth/login",
    data,
  });
}
