import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/slices/authSlice";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("accessToken");
    navigate("/admin/login", { replace: true });
  };

  return (
    <main className='flex min-h-screen items-center justify-center bg-slate-50 px-6'>
      <div className='w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm'>
        <p className='text-sm font-medium uppercase tracking-[0.2em] text-slate-500'>
          Admin
        </p>
        <h1 className='mt-3 text-3xl font-semibold tracking-tight text-slate-900'>
          Welcome back
        </h1>
        <p className='mt-3 text-slate-600'>
          You are signed in and redirected to the admin area.
        </p>

        <div className='mt-6 flex justify-end'>
          <Button onClick={handleLogout} variant='outline'>
            Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}
