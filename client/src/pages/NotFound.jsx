import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

import { PageBody } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <PageBody className="max-w-xl">
      <div className="flex flex-col items-center py-16 text-center">
        <span className="grid size-14 place-items-center rounded-xl bg-accent text-accent-foreground">
          <FileQuestion className="size-7" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          That route does not exist in the clinical application.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/assessment">Go to assessment</Link>
          </Button>
        </div>
      </div>
    </PageBody>
  )
}
