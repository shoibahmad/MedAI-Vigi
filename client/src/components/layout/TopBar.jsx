import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Activity, Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ServerStatusDot } from '@/components/layout/ServerStatusDot'
import { LEGACY_LINKS, NAV_ITEMS } from '@/lib/navigation'

function Brand({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2.5 shrink-0">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Activity className="size-5" strokeWidth={2.5} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">PhenoRx</span>
        <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
          Pharmacogenomic ADR Risk
        </span>
      </span>
    </Link>
  )
}

const linkBase =
  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors'

export function TopBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="no-print sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Brand />

        <nav className="ml-auto hidden items-center gap-0.5 lg:flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  linkBase,
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-2">
          <ServerStatusDot />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <div className="border-b px-5 py-4">
                <SheetTitle asChild>
                  <div>
                    <Brand onClick={() => setOpen(false)} />
                  </div>
                </SheetTitle>
              </div>
              <nav className="flex flex-col gap-1 p-3">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        linkBase,
                        'py-2.5',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    <Icon className="size-4" />
                    {label}
                  </NavLink>
                ))}

                <div className="my-2 border-t" />

                {LEGACY_LINKS.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className={cn(linkBase, 'py-2.5 text-muted-foreground hover:bg-muted')}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
