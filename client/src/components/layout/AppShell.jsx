import { Outlet } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { Footer } from '@/components/layout/Footer'

/**
 * Standard chrome for every clinical page. Used as a react-router layout route,
 * so pages render through <Outlet /> rather than being passed as children.
 */
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

/** Constrained page container with a heading block. */
export function PageHeader({ title, description, icon: Icon, actions }) {
  return (
    <div className="border-b bg-card">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          {Icon ? (
            <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground sm:grid">
              <Icon className="size-6" />
            </span>
          ) : null}
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

export function PageBody({ children, className = '' }) {
  return (
    <div className={`mx-auto max-w-[1400px] px-4 py-8 sm:px-6 ${className}`}>{children}</div>
  )
}
