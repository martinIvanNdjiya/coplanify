import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profil";
import Voyages from "./components/Voyages.jsx";
import Chat from "./components/Chat.jsx";
import GroupPage from "./components/GroupePage.jsx";
import Sondage from "./components/Sondage.jsx";
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
        <Route path="/chat" element={<Chat />} />
        <Route path="/group/:groupName" element={<GroupPage />} />
        <Route path="/sondages" element={<Sondage />} />
      </Routes>
    </Router>
  );
}

export default App;
