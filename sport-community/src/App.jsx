import { Navigate, Route, Routes } from 'react-router-dom'
import PhoneFrame from './components/PhoneFrame.jsx'
import BottomNav from './components/BottomNav.jsx'
import MaCarte from './pages/MaCarte.jsx'
import Communaute from './pages/Communaute.jsx'
import Evenements from './pages/Evenements.jsx'
import Explorer from './pages/Explorer.jsx'
import Profil from './pages/Profil.jsx'

export default function App() {
  return (
    <PhoneFrame>
      <Routes>
        <Route path="/" element={<MaCarte />} />
        <Route path="/communaute" element={<Communaute />} />
        <Route path="/evenements" element={<Evenements />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </PhoneFrame>
  )
}
