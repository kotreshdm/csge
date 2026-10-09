import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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

const readPersistedUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedUser = localStorage.getItem('authUser');
    if (!storedUser) return null;

    const user: unknown = JSON.parse(storedUser);
    if (!user || typeof user !== 'object') return null;

    const candidate = user as Partial<User>;
    return typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.role === 'string'
      ? (candidate as User)
      : null;
  } catch {
    return null;
  }
};

const persistUser = (user: User | null) => {
  if (typeof window === 'undefined') return;

  if (user) {
    localStorage.setItem('authUser', JSON.stringify(user));
    return;
  }

  localStorage.removeItem('authUser');
};

const initialState: AuthState = {
  isAuthenticated: typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken')),
  user: readPersistedUser(),
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
};

const persistAccessToken = (token: string | null) => {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem('accessToken', token);
    return;
  }

  localStorage.removeItem('accessToken');
};

const authSlice = createSlice({
  name: 'auth',
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
      persistUser(action.payload.user);
    },

    logout: state => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      persistAccessToken(null);
      persistUser(null);
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      persistUser(action.payload);
    },
  },
});

export const { loginSuccess, logout, setUser } = authSlice.actions;

export default authSlice.reducer;
