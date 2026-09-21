import { Building2 } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { label: "Login", to: "/admin/login" },
  { label: "Register", to: "/admin/register" },
];

function Header() {
  return (
    <header className='border-b bg-background'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo */}
        <Link to='/admin/login' className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary'>
            <Building2 className='h-5 w-5 text-primary-foreground' />
          </div>

          <div>
            <p className='text-sm font-semibold tracking-tight'>CSGE</p>
            <p className='text-[11px] text-muted-foreground'>
              Management System
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className='flex items-center gap-1'>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Header;
