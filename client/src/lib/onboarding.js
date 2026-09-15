/**
 * First-run state for the splash screen and product tour.
 *
 * Kept out of the components so those files export only components, which is
 * what fast refresh needs, and so the storage policy lives in one place.
 *
 * The two use different storage on purpose:
 *   splash  - sessionStorage, so it plays once per visit
 *   tour    - localStorage, because a tour that returns every session is an
 *             irritation rather than onboarding
 */

const SPLASH_KEY = 'phenorx.splash.seen'
const TOUR_KEY = 'phenorx.walkthrough.seen'

export const SPLASH_DURATION_MS = 5000

function safeGet(storage, key) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(storage, key) {
  try {
    storage.setItem(key, '1')
  } catch {
    // Private mode or storage disabled; it simply shows again next time.
  }
}

export function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

export function shouldShowSplash() {
  if (typeof window === 'undefined') return false
  if (safeGet(sessionStorage, SPLASH_KEY)) return false
  // A five second hold is decoration; honour a request for less motion.
  return !prefersReducedMotion()
}

export function markSplashSeen() {
  if (typeof window !== 'undefined') safeSet(sessionStorage, SPLASH_KEY)
}

export function shouldShowWalkthrough() {
  if (typeof window === 'undefined') return false
  return !safeGet(localStorage, TOUR_KEY)
}

export function markWalkthroughSeen() {
  if (typeof window !== 'undefined') safeSet(localStorage, TOUR_KEY)
}
