import { Navigate, Route, Routes } from 'react-router-dom'
import PhoneFrame from './components/PhoneFrame.jsx'
import BottomNav from './components/BottomNav.jsx'
import MaCarte from './pages/MaCarte.jsx'
import Communaute from './pages/Communaute.jsx'
import AnnonceDetail from './pages/AnnonceDetail.jsx'
import NouvelleAnnonce from './pages/NouvelleAnnonce.jsx'
import GroupeDetail from './pages/GroupeDetail.jsx'
import NouveauGroupe from './pages/NouveauGroupe.jsx'
import Conversation from './pages/Conversation.jsx'
import Evenements from './pages/Evenements.jsx'
import EvenementDetail from './pages/EvenementDetail.jsx'
import Explorer from './pages/Explorer.jsx'
import StructureDetail from './pages/StructureDetail.jsx'
import EquipementDetail from './pages/EquipementDetail.jsx'
import Reserver from './pages/Reserver.jsx'
import Reservations from './pages/Reservations.jsx'
import ReservationDetail from './pages/ReservationDetail.jsx'
import Pass from './pages/Pass.jsx'
import Pros from './pages/Pros.jsx'
import Profil from './pages/Profil.jsx'
import APropos from './pages/APropos.jsx'

export default function App() {
  return (
    <PhoneFrame>
      <Routes>
        <Route path="/" element={<MaCarte />} />
        <Route path="/communaute" element={<Communaute />} />
        <Route path="/communaute/annonces/nouvelle" element={<NouvelleAnnonce />} />
        <Route path="/communaute/annonces/:id" element={<AnnonceDetail />} />
        <Route path="/communaute/groupes/nouveau" element={<NouveauGroupe />} />
        <Route path="/communaute/groupes/:id" element={<GroupeDetail />} />
        <Route path="/communaute/messages/:id" element={<Conversation />} />
        <Route path="/evenements" element={<Evenements />} />
        <Route path="/evenements/:id" element={<EvenementDetail />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/explorer/structures/:id" element={<StructureDetail />} />
        <Route path="/explorer/equipements/:id" element={<EquipementDetail />} />
        <Route path="/explorer/reserver/:id" element={<Reserver />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/reservations/:id" element={<ReservationDetail />} />
        <Route path="/pass" element={<Pass />} />
        <Route path="/pros" element={<Pros />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/profil/a-propos" element={<APropos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </PhoneFrame>
  )
}
