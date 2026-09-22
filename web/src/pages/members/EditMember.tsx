import { Link, useParams } from "react-router-dom";
import { ROUTES } from "../../const/routs";
import { Button } from "@/components/ui/button";

export default function EditMember() {
  const { id } = useParams();

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-3xl'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900'>
              Edit Member
            </h1>

            <p className='mt-1 text-sm text-slate-500'>
              Update member information.
            </p>
          </div>

          <Button variant='outline'>
            <Link to={ROUTES.ADMIN.MEMBERS}>Back</Link>
          </Button>
        </div>

        <div className='mt-6 rounded-xl border border-slate-200 bg-white p-6'>
          <p className='text-sm text-slate-500'>Editing member: {id}</p>

          {/* Member edit form will go here */}
        </div>
      </div>
    </main>
  );
}
