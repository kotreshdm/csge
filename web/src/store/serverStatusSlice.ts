import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ServerStatus = "UNKNOWN" | "ONLINE" | "OFFLINE";

interface ServerStatusState {
  status: ServerStatus;
  message: string;
  lastCheckedAt: string | null;
}

const initialState: ServerStatusState = {
  status: "UNKNOWN",
  message: "Checking server...",
  lastCheckedAt: null,
};

const serverStatusSlice = createSlice({
  name: "serverStatus",
  initialState,
  reducers: {
    setServerOnline: (state, action: PayloadAction<string | undefined>) => {
      state.status = "ONLINE";
      state.message = action.payload ?? "Server is available";
      state.lastCheckedAt = new Date().toISOString();
    },

    setServerOffline: (state, action: PayloadAction<string | undefined>) => {
      state.status = "OFFLINE";
      state.message = action.payload ?? "Server is unavailable";
      state.lastCheckedAt = new Date().toISOString();
    },

    setServerChecking: (state) => {
      state.status = "UNKNOWN";
      state.message = "Checking server...";
    },
  },
});

export const { setServerOnline, setServerOffline, setServerChecking } =
  serverStatusSlice.actions;

export default serverStatusSlice.reducer;
