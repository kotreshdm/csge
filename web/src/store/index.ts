import { configureStore } from "@reduxjs/toolkit";
import serverStatusReducer from "./serverStatusSlice";

export const store = configureStore({
  reducer: {
    serverStatus: serverStatusReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
