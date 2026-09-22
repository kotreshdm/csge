import { configureStore } from "@reduxjs/toolkit";
import serverStatusReducer from "./slices/serverStatusSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    serverStatus: serverStatusReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
