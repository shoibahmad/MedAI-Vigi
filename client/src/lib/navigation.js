import { Bot, ClipboardList, FileText, Network, Stethoscope, UsersRound } from 'lucide-react'

/** Routes owned by the SPA. */
export const NAV_ITEMS = [
  { to: '/assessment', label: 'Assessment', icon: ClipboardList },
  { to: '/report', label: 'Report', icon: FileText },
  { to: '/drug-interactions', label: 'Interactions', icon: Network },
  { to: '/clinical-decision-support', label: 'Decision Support', icon: Stethoscope },
  { to: '/patient-counselling', label: 'Counselling', icon: UsersRound },
  { to: '/chatbot', label: 'Assistant', icon: Bot },
]

/**
 * Content pages. These are client-side routes now, so they use <Link>.
 * URLs are hyphenated to match the rest of the app.
 */
export const CONTENT_LINKS = [
  { to: '/methodology', label: 'Methodology' },
  { to: '/about', label: 'About' },
  { to: '/documentation', label: 'Documentation' },
  { to: '/api-reference', label: 'API Reference' },
  { to: '/research-papers', label: 'Research Papers' },
  { to: '/faqs', label: 'FAQs' },
]

export const LEGAL_LINKS = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-of-service', label: 'Terms of Service' },
  { to: '/cookie-policy', label: 'Cookie Policy' },
]

/**
 * The Jinja pages were registered with underscores. Anything already linking to
 * those URLs keeps working via a redirect to the canonical hyphenated route.
 */
export const LEGACY_URL_ALIASES = [
  { from: '/api_reference', to: '/api-reference' },
  { from: '/research_papers', to: '/research-papers' },
  { from: '/privacy_policy', to: '/privacy-policy' },
  { from: '/terms_of_service', to: '/terms-of-service' },
  { from: '/cookie_policy', to: '/cookie-policy' },
  { from: '/patient_details_form', to: '/patient-details' },
  { from: '/clinical_decision_support', to: '/clinical-decision-support' },
  { from: '/drug_interactions', to: '/drug-interactions' },
  { from: '/patient_counselling', to: '/patient-counselling' },
  { from: '/medical_report', to: '/report' },
]
