import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  memberId?: string;
  memberCode?: string;
  name: string;
  email?: string;
  mobile?: string;
  role: string;
  memberType?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
};

const persistAccessToken = (token: string | null) => {
  if (typeof window === "undefined") return;

  if (token) {
    localStorage.setItem("accessToken", token);
    return;
  }

  localStorage.removeItem("accessToken");
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
      }>,
    ) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      persistAccessToken(action.payload.accessToken);
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      persistAccessToken(null);
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
});

export const { loginSuccess, logout, setUser } = authSlice.actions;

export default authSlice.reducer;
