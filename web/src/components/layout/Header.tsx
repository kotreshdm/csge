import { Building2, LogOut } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "src/store";
import { logout } from "../../store/slices/authSlice";
const navItems = [
  { label: "Login", to: "/admin/login" },
  { label: "Register", to: "/admin/register" },
];
function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const handleSignOut = () => {
    dispatch(logout());
    navigate("/admin/login");
  };
  return (
    <header className='border-b bg-background'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        <Link to='/admin/login' className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary'>
            <Building2 className='h-5 w-5 text-primary-foreground' />{" "}
          </div>{" "}
          <div>
            <p className='text-sm font-semibold tracking-tight'>CSGE</p>{" "}
            <p className='text-[11px] text-muted-foreground'>
              {" "}
              Management System{" "}
            </p>{" "}
          </div>{" "}
        </Link>{" "}
        {/* Navigation */}{" "}
        {isLoggedIn ? (
          <div className='flex items-center gap-4'>
            {" "}
            {user?.name && (
              <span className='text-sm text-muted-foreground'>
                {" "}
                {user.name}{" "}
              </span>
            )}{" "}
            <button
              type='button'
              onClick={handleSignOut}
              className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              {" "}
              <LogOut className='h-4 w-4' /> Sign Out{" "}
            </button>{" "}
          </div>
        ) : (
          <nav className='flex items-center gap-1'>
            {" "}
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
                }
              >
                {" "}
                {item.label}{" "}
              </NavLink>
            ))}{" "}
          </nav>
        )}{" "}
      </div>{" "}
    </header>
  );
}
export default Header;
