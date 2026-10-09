import { Building2, ChevronDown, LogOut } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { ROUTES } from '../../const/routs';
import type { RootState } from 'src/store';
import { logout } from '../../store/slices/authSlice';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

const dropdownLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block w-full rounded-md px-3 py-2 text-left text-sm ${
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

const menuGroups = [
  {
    label: 'Members',
    items: [
      { label: 'Members', to: ROUTES.ADMIN.MEMBERS },
      {
        label: 'Address History',
        to: ROUTES.ADMIN.MEMBER_ADDRESS_HISTORY,
      },
      { label: 'Directors', to: ROUTES.ADMIN.DIRECTORS },
      {
        label: 'GBM Returns',
        to: ROUTES.ADMIN.GBM_LETTER_RETURNS,
      },
    ],
  },
  {
    label: 'Transactions',
    items: [
      {
        label: 'Transactions',
        to: ROUTES.ADMIN.TRANSACTIONS,
      },
      {
        label: 'Cheque Ranges',
        to: ROUTES.ADMIN.CHEQUE_RANGES,
      },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { label: 'Parties', to: ROUTES.ADMIN.PARTIES },
      { label: 'Layouts', to: ROUTES.ADMIN.LAYOUTS },
      { label: 'Sites', to: ROUTES.ADMIN.SITES },
    ],
  },
];

const publicNavItems = [
  { label: 'Login', to: ROUTES.ADMIN.LOGIN },
  { label: 'Register', to: ROUTES.ADMIN.REGISTER },
];

function DropdownMenu({ label, items }: { label: string; items: { label: string; to: string }[] }) {
  return (
    <div className='group relative'>
      <button
        type='button'
        className='flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
      >
        {label}
        <ChevronDown className='h-4 w-4' />
      </button>

      <div className='invisible absolute left-0 top-full z-50 mt-1 w-48 rounded-md border bg-background p-1 opacity-0 shadow-md transition-all group-hover:visible group-hover:opacity-100'>
        {items.map(item => (
          <NavLink key={item.to} to={item.to} className={dropdownLinkClass}>
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const handleSignOut = () => {
    dispatch(logout());
    navigate(ROUTES.ADMIN.LOGIN, { replace: true });
  };

  return (
    <header className='border-b bg-background'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo */}
        <Link
          to={isAuthenticated ? ROUTES.ADMIN.ROOT : ROUTES.ADMIN.LOGIN}
          className='flex items-center gap-3'
        >
          <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary'>
            <Building2 className='h-5 w-5 text-primary-foreground' />
          </div>

          <div>
            <p className='text-sm font-semibold tracking-tight'>CSGE</p>
            <p className='text-[11px] text-muted-foreground'>Management System</p>
          </div>
        </Link>

        {/* Navigation */}
        {isAuthenticated ? (
          <div className='flex items-center gap-3'>
            <nav className='flex items-center gap-1'>
              {/* Dashboard */}
              <NavLink to={ROUTES.ADMIN.ROOT} className={navLinkClass}>
                Dashboard
              </NavLink>

              {/* Dropdowns */}
              {menuGroups.map(group => (
                <DropdownMenu key={group.label} label={group.label} items={group.items} />
              ))}
            </nav>

            {/* User */}
            {user?.name && <span className='text-sm text-muted-foreground'>{user.name}</span>}

            {/* Sign Out */}
            <button
              type='button'
              onClick={handleSignOut}
              className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              <LogOut className='h-4 w-4' />
              Sign Out
            </button>
          </div>
        ) : (
          <nav className='flex items-center gap-1'>
            {publicNavItems.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
