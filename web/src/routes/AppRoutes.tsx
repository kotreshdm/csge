import { Navigate, Route, Routes } from "react-router-dom";

import AdminDashboard from "../pages/AdminDashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";
import type { JSX } from "react/jsx-runtime";

function hasAccessToken() {
  return Boolean(localStorage.getItem("accessToken"));
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  return hasAccessToken() ? children : <Navigate to='/admin/login' replace />;
}

function RedirectIfAuthenticated({ children }: { children: JSX.Element }) {
  return hasAccessToken() ? <Navigate to='/admin' replace /> : children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path='/admin'
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path='/admin/login'
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />

      <Route
        path='/admin/register'
        element={
          <RedirectIfAuthenticated>
            <Register />
          </RedirectIfAuthenticated>
        }
      />

      <Route path='/' element={<Navigate to='/admin/login' replace />} />
      <Route path='*' element={<Navigate to='/admin/login' replace />} />
    </Routes>
  );
}
