import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

import { ROUTES } from '../const/routs';
import AdminDashboard from '../pages/AdminDashboard';
import LayoutDashboardPage from '../pages/LayoutDashboardPage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import AddTransaction from '../pages/transactions/AddTransaction';
import EditTransaction from '../pages/transactions/EditTransaction';
import Transactions from '../pages/transactions/TransactionsList';
import ChequeRanges from '../pages/chequeRanges/ChequeRanges';

const protectedRoutes: { path: string; element: ReactNode }[] = [
  {
    path: ROUTES.ADMIN.ROOT,
    element: <AdminDashboard />,
  },
  {
    path: ROUTES.ADMIN.LAYOUT_DASHBOARD,
    element: <LayoutDashboardPage />,
  },
  {
    path: ROUTES.ADMIN.TRANSACTIONS,
    element: <Transactions />,
  },
  {
    path: ROUTES.ADMIN.CHEQUE_RANGES,
    element: <ChequeRanges />,
  },
  {
    path: ROUTES.ADMIN.TRANSACTIONS_ADD,
    element: <AddTransaction />,
  },
  {
    path: '/admin/transactions/:id/edit',
    element: <EditTransaction />,
  },
];

const publicRoutes: { path: string; element: ReactNode }[] = [
  {
    path: ROUTES.ADMIN.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.ADMIN.REGISTER,
    element: <Register />,
  },
];

const isAuthenticated = () => Boolean(localStorage.getItem('accessToken'));

function ProtectedRoute({ children }: { children: ReactNode }) {
  return isAuthenticated() ? children : <Navigate to={ROUTES.ADMIN.LOGIN} replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  return isAuthenticated() ? <Navigate to={ROUTES.ADMIN.ROOT} replace /> : children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {protectedRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
      ))}

      {publicRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={<PublicRoute>{element}</PublicRoute>} />
      ))}

      <Route
        path='/admin/layout-dashboard'
        element={<Navigate to={ROUTES.ADMIN.LAYOUT_DASHBOARD} replace />}
      />
      <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.ADMIN.LOGIN} replace />} />

      <Route path='*' element={<Navigate to={ROUTES.ADMIN.LOGIN} replace />} />
    </Routes>
  );
}
