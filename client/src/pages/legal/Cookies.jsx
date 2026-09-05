import { LegalPage } from '@/pages/LegalPage'
import { COOKIE_POLICY } from '@/lib/legalContent'

export default function Cookies() {
  return <LegalPage doc={COOKIE_POLICY} />
}
