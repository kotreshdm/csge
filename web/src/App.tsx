import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { Toaster } from '@/components/ui/sonner';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { ROUTES } from './const/routs';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Members from './pages/members/Members';
import AddMember from './pages/members/AddMember';
import EditMember from './pages/members/EditMember';
import type { RootState } from './store';
import Parties from './pages/parties/Parties';
import AddParty from './pages/parties/AddParty';
import EditParty from './pages/parties/EditParty';
import Layouts from './pages/layouts/Layouts';
import AddLayout from './pages/layouts/AddLayout';
import EditLayout from './pages/layouts/EditLayout';
import Accounts from './pages/accounts/Accounts';
import AddAccount from './pages/accounts/AddAccount';
import EditAccount from './pages/accounts/EditAccount';
import Transactions from './pages/transactions/Transactions';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return isAuthenticated ? children : <Navigate to={ROUTES.ADMIN.LOGIN} replace />;
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return isAuthenticated ? <Navigate to={ROUTES.ADMIN.ROOT} replace /> : children;
}

export default function App() {
  return (
    <div className='flex min-h-screen flex-col bg-muted/30'>
      <Header />

      <main className='flex-1'>
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

          <Route
            path={ROUTES.ADMIN.MEMBERS}
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.MEMBERS_ADD}
            element={
              <ProtectedRoute>
                <AddMember />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.MEMBERS_EDIT(':id')}
            element={
              <ProtectedRoute>
                <EditMember />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.PARTIES}
            element={
              <ProtectedRoute>
                <Parties />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.PARTIES_ADD}
            element={
              <ProtectedRoute>
                <AddParty />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.PARTIES_EDIT(':id')}
            element={
              <ProtectedRoute>
                <EditParty />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.LAYOUTS}
            element={
              <ProtectedRoute>
                <Layouts />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.LAYOUTS_ADD}
            element={
              <ProtectedRoute>
                <AddLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.LAYOUTS_EDIT(':id')}
            element={
              <ProtectedRoute>
                <EditLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.ACCOUNTS}
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.ACCOUNTS_ADD}
            element={
              <ProtectedRoute>
                <AddAccount />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADMIN.ACCOUNTS_EDIT(':id')}
            element={
              <ProtectedRoute>
                <EditAccount />
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

          <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.ADMIN.LOGIN} replace />} />
          <Route path='*' element={<Navigate to={ROUTES.ADMIN.LOGIN} replace />} />
        </Routes>
      </main>

      <Toaster position='bottom-right' richColors duration={5000} />
      <Footer />
    </div>
  );
}
