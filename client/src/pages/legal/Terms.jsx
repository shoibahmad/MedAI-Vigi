import { LegalPage } from '@/pages/LegalPage'
import { TERMS_OF_SERVICE } from '@/lib/legalContent'

export default function Terms() {
  return <LegalPage doc={TERMS_OF_SERVICE} />
}
