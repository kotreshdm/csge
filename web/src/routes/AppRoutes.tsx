import { Navigate, Route, Routes } from 'react-router-dom';

import { ROUTES } from '../const/routs';
import AdminDashboard from '../pages/AdminDashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import AddTransaction from '../pages/transactions/AddTransaction';
import EditTransaction from '../pages/transactions/EditTransaction';
import Transactions from '../pages/transactions/TransactionsList';
import type { JSX } from 'react/jsx-runtime';

function hasAccessToken() {
  return Boolean(localStorage.getItem('accessToken'));
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  return hasAccessToken() ? children : <Navigate to={ROUTES.ADMIN.LOGIN} replace />;
}

function RedirectIfAuthenticated({ children }: { children: JSX.Element }) {
  return hasAccessToken() ? <Navigate to={ROUTES.ADMIN.ROOT} replace /> : children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.ADMIN.ROOT}
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN.TRANSACTIONS}
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.TRANSACTIONS_ADD}
        element={
          <ProtectedRoute>
            <AddTransaction />
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/transactions/:id/edit'
        element={
          <ProtectedRoute>
            <EditTransaction />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN.LOGIN}
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />

      <Route
        path={ROUTES.ADMIN.REGISTER}
        element={
          <RedirectIfAuthenticated>
            <Register />
          </RedirectIfAuthenticated>
        }
      />

      <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.ADMIN.LOGIN} replace />} />
      <Route path='*' element={<Navigate to={ROUTES.ADMIN.LOGIN} replace />} />
    </Routes>
  );
}
