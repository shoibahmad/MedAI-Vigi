import { LegalPage } from '@/pages/LegalPage'
import { PRIVACY_POLICY } from '@/lib/legalContent'

export default function Privacy() {
  return <LegalPage doc={PRIVACY_POLICY} />
}
