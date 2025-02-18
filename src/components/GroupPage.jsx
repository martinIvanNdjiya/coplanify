import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../config/firebase-config";
import { getAuth } from "firebase/auth";
import Chat from "./Chat";
import Sondage from "./Sondage";
import ParamsGroupe from "./ParamsGroupe";
import { FiMessageSquare, FiSettings, FiLogOut } from "react-icons/fi";

const GroupPage = () => {
  const { groupName } = useParams();
  const [groupeId, setGroupeId] = useState(null);
  const [createur, setCreateur] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const navigate = useNavigate();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const fetchGroupData = async () => {
      try {
        const groupsRef = collection(db, "groups");
        const q = query(groupsRef, where("name", "==", groupName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const groupDoc = querySnapshot.docs[0];
          const groupData = groupDoc.data();

          setGroupeId(groupDoc.id);
          setCreateur(groupData.createur);
          setParticipants(groupData.participants);

          if (!groupData.participants.includes(userId)) {
            console.error("Vous n'êtes pas membre de ce groupe !");
            navigate("/dashboard");
          }
        } else {
          console.error("Groupe non trouvé !");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données du groupe :", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupName, navigate, userId]);

  const handleLeaveGroup = async () => {
    const confirmLeave = window.confirm("Êtes-vous sûr de vouloir quitter ce groupe ?");
    if (confirmLeave) {
      try {
        const groupRef = doc(db, "groups", groupeId);
        await updateDoc(groupRef, {
          participants: arrayRemove(userId),
        });
        navigate("/dashboard");
      } catch (error) {
        console.error("Erreur lors de la sortie du groupe :", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg font-semibold">Chargement du groupe...</p>
      </div>
    );
  }

  if (!groupeId || !userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500 text-lg font-semibold">Erreur : groupe non trouvé ou utilisateur non connecté.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen overflow-hidden bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md border-b border-gray-300">
        <div className="w-full px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-4xl font-extrabold text-blue-500 flex-grow">
            Coplanify
          </Link>
          <div className="ml-auto">
            <ul className="flex space-x-6">
              <li>
                <Link to="/dashboard" className="text-lg text-gray-700 hover:text-blue-500 transition">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/voyages" className="text-lg text-gray-700 hover:text-blue-500 transition">
                  Voyages
                </Link>
              </li>
              <li>
                <Link to="/groupes" className="text-lg text-gray-700 hover:text-blue-500 transition">
                  Groupes
                </Link>
              </li>
              <li>
                <Link to="/profil" className="text-lg text-gray-700 hover:text-blue-500 transition">
                  Profil
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-1 h-full">
        {/* Sidebar */}
        <aside className="w-72 bg-white shadow-lg border-r border-gray-300 flex flex-col p-6">
          <nav className="space-y-4">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center text-lg font-medium px-3 py-2 rounded-lg transition duration-300 ${activeTab === "chat" ? "text-blue-500" : "text-gray-700"
                }`}
            >
              <FiMessageSquare className="mr-3 text-2xl" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("sondages")}
              className={`flex items-center text-lg font-medium px-3 py-2 rounded-lg transition duration-300 ${activeTab === "sondages" ? "text-blue-500" : "text-gray-700"
                }`}
            >
              <FiSettings className="mr-3 text-2xl" />
              Sondages
            </button>
            {createur === userId && (
              <button
                onClick={() => setActiveTab("parametres")}
                className={`flex items-center text-lg font-medium px-3 py-2 rounded-lg transition duration-300 ${activeTab === "parametres" ? "text-blue-500" : "text-gray-700"
                  }`}
              >
                <FiSettings className="mr-3 text-2xl" />
                Paramètres
              </button>
            )}
            {createur !== userId && (
              <button
                onClick={handleLeaveGroup}
                className="flex items-center text-lg font-medium px-3 py-2 rounded-lg transition duration-300 text-red-500"
              >
                <FiLogOut className="mr-3 text-2xl" />
                Quitter le groupe
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-start relative h-full overflow-hidden">
          {/* Background Image - Full Page */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                activeTab === "chat"
                  ? "url('/chat1.jpg')"
                  : "url('/sondage1.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>

          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        {/* Main Content Box */}
                  <div
                    className="relative z-10 w-full max-w-4xl bg-white shadow-2xl rounded-3xl p-8 border border-gray-200 mt-12"
                    style={{ height: activeTab === "chat" ? "75vh" : "85vh" }}
                  >
                    {/* Section Header */}
            <div className="flex items-center justify-between border-b border-gray-300 pb-4 mb-6">
              <h1 className="text-3xl font-extrabold text-blue-600">{groupName}</h1>
              <span className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-200 rounded-full shadow-sm">
                {activeTab === "chat" ? "💬 Chat Actif" : activeTab === "sondages" ? "📊 Sondages" : "⚙️ Paramètres"}
              </span>
            </div>

            {/* Dynamic Content */}
            <div className="relative z-10 p-6 bg-white rounded-2xl shadow-md transition-transform duration-300" style={{ height: "calc(100% - 6rem)" }}>
              {activeTab === "chat" && groupeId && userId && (
                <Chat groupeId={groupeId} userId={userId} />
              )}
              {activeTab === "sondages" && groupeId && (
                <Sondage groupeId={groupeId} />
              )}
              {activeTab === "parametres" && groupeId && (
                <ParamsGroupe groupeId={groupeId} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
