import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AssessmentProvider } from '@/context/AssessmentContext'
import { AppShell } from '@/components/layout/AppShell'
import { LEGACY_URL_ALIASES } from '@/lib/navigation'
import { Skeleton } from '@/components/ui/skeleton'

import Landing from '@/pages/Landing'
import PatientDetails from '@/pages/PatientDetails'

// The assessment form and the report carry the heaviest markup; split them so the
// landing page is not paying for them.
const Assessment = lazy(() => import('@/pages/Assessment'))
const Report = lazy(() => import('@/pages/Report'))
const DrugInteractions = lazy(() => import('@/pages/DrugInteractions'))
const ClinicalDecisionSupport = lazy(() => import('@/pages/ClinicalDecisionSupport'))
const Counselling = lazy(() => import('@/pages/Counselling'))
const Chatbot = lazy(() => import('@/pages/Chatbot'))
const Methodology = lazy(() => import('@/pages/Methodology'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Content and legal pages, migrated off Jinja so the whole app shares one shell.
const About = lazy(() => import('@/pages/About'))
const Documentation = lazy(() => import('@/pages/Documentation'))
const ApiReference = lazy(() => import('@/pages/ApiReference'))
const ResearchPapers = lazy(() => import('@/pages/ResearchPapers'))
const Faqs = lazy(() => import('@/pages/Faqs'))
const Privacy = lazy(() => import('@/pages/legal/Privacy'))
const Terms = lazy(() => import('@/pages/legal/Terms'))
const Cookies = lazy(() => import('@/pages/legal/Cookies'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function RouteFallback() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-10 sm:px-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <AssessmentProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/patient-details" element={<PatientDetails />} />
                  <Route path="/assessment" element={<Assessment />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/drug-interactions" element={<DrugInteractions />} />
                  <Route path="/clinical-decision-support" element={<ClinicalDecisionSupport />} />
                  <Route path="/patient-counselling" element={<Counselling />} />
                  <Route path="/chatbot" element={<Chatbot />} />
                  <Route path="/methodology" element={<Methodology />} />

                  <Route path="/about" element={<About />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/api-reference" element={<ApiReference />} />
                  <Route path="/research-papers" element={<ResearchPapers />} />
                  <Route path="/faqs" element={<Faqs />} />
                  <Route path="/privacy-policy" element={<Privacy />} />
                  <Route path="/terms-of-service" element={<Terms />} />
                  <Route path="/cookie-policy" element={<Cookies />} />

                  {/* The Jinja pages used underscores; keep those URLs working. */}
                  {LEGACY_URL_ALIASES.map(({ from, to }) => (
                    <Route key={from} path={from} element={<Navigate to={to} replace />} />
                  ))}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AssessmentProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
