import { Link } from "react-router-dom";
import { ROUTES } from "../../const/routs";
import { Button } from "@/components/ui/button";

export default function Members() {
  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900'>Members</h1>

            <p className='mt-1 text-sm text-slate-500'>Manage all members.</p>
          </div>

          <Button>
            <Link to={ROUTES.ADMIN.MEMBERS_ADD}>Add Member</Link>
          </Button>
        </div>

        <div className='mt-6 rounded-xl border border-slate-200 bg-white p-6'>
          <p className='text-sm text-slate-500'>
            Members list will appear here.
          </p>
        </div>
      </div>
    </main>
  );
}
