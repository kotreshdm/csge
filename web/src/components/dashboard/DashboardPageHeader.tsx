import { Link } from 'react-router-dom';

import { ROUTES } from '../../const/routs';

type DashboardView = 'overview' | 'layout' | 'share';

const dashboardViews: Array<{ id: DashboardView; label: string; href: string }> = [
  { id: 'overview', label: 'Overview', href: ROUTES.ADMIN.ROOT },
  { id: 'layout', label: 'Layout Dashboard', href: ROUTES.ADMIN.LAYOUT_DASHBOARD },
  { id: 'share', label: 'Share Dashboard', href: ROUTES.ADMIN.SHARE_DASHBOARD },
];

export function DashboardPageHeader({
  title,
  currentView,
}: {
  title: string;
  currentView: DashboardView;
}) {
  return (
    <header className='flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4'>
      <div>
        <p className='text-sm font-medium text-emerald-800'>Dashboard</p>
        <h1 className='mt-1 text-2xl font-semibold text-slate-950'>{title}</h1>
      </div>
      <nav
        aria-label='Dashboard views'
        className='flex gap-1 rounded-md border border-slate-200 bg-white p-1'
      >
        {dashboardViews.map(view =>
          view.id === currentView ? (
            <span
              key={view.id}
              aria-current='page'
              className='rounded bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white'
            >
              {view.label}
            </span>
          ) : (
            <Link
              key={view.id}
              to={view.href}
              className='rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100'
            >
              {view.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}