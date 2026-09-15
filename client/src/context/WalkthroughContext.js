import { createContext, useContext } from 'react'

/**
 * Lets any component reopen the product tour. Defaults to a no-op so a component
 * rendered outside the provider (a test, say) does not have to guard the call.
 */
export const WalkthroughContext = createContext(() => {})

export function useWalkthrough() {
  return useContext(WalkthroughContext)
}
