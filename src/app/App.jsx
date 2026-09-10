import { Routes, Route } from 'react-router-dom'
import AuthGate from './AuthGate.jsx'
import IdentityGate from './IdentityGate.jsx'
import HomePage from '../features/room/HomePage.jsx'
import RoomPage from '../features/room/RoomPage.jsx'

export default function App() {
  return (
    <AuthGate>
      <IdentityGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:code" element={<RoomPage />} />
        </Routes>
      </IdentityGate>
    </AuthGate>
  )
}
