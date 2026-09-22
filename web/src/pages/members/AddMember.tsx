import { Link } from "react-router-dom";
import { ROUTES } from "../../const/routs";
import { Button } from "@/components/ui/button";

export default function AddMember() {
  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-3xl'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900'>
              Add Member
            </h1>

            <p className='mt-1 text-sm text-slate-500'>Create a new member.</p>
          </div>

          <Button variant='outline'>
            <Link to={ROUTES.ADMIN.MEMBERS}>Back</Link>
          </Button>
        </div>

        <div className='mt-6 rounded-xl border border-slate-200 bg-white p-6'>
          {/* Member form will go here */}
        </div>
      </div>
    </main>
  );
}
