import { useGuestIdentity } from '../features/identity/useGuestIdentity.js'
import NamePrompt from '../features/identity/NamePrompt.jsx'

/**
 * Sits below AuthGate. Once Firebase auth is ready (uid exists),
 * checks if the user has a display name. If not, shows the name prompt.
 * After the name is set, renders children — the actual app.
 */
export default function IdentityGate({ children }) {
  const { hasName, saveName } = useGuestIdentity()

  if (!hasName) {
    return <NamePrompt onSubmit={saveName} />
  }

  return children
}
