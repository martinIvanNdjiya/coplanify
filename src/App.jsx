import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profil";
import Voyages from "./components/Voyages.jsx";
import Chat from "./components/Chat.jsx";
import GroupPage from "./components/GroupPage.jsx";
import Sondage from "./components/Sondage.jsx";
import SondageDetails from "./components/sondageDetails.jsx";
import Amis from "./components/Amis.jsx";
import Groupes from './components/Groupes.jsx';
import VoyageDetails from './components/VoyageDetails .jsx'

function App() {

  return (
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/voyages" element={<Voyages />} />
          <Route path="/voyage/:id" element={<VoyageDetails />} />
          <Route path="/group/:groupeId/chat" element={<Chat />} />
          <Route path="/group/:groupName" element={<GroupPage />} />
          <Route path="/group/:groupId/sondages" element={<Sondage />} />
          <Route path="/group/:groupId/sondages/:pollId" element={<SondageDetails />} />
          <Route path="/amis" element={<Amis />} />
          <Route path="/groupes" element={<Groupes />} />
        </Routes>
      </Router>
  );
}

export default App;
