import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "../config/firebase-config";
import { getAuth } from "firebase/auth";
import Chat from "./Chat";
import Sondage from "./Sondage";
import ParamsGroupe from "./ParamsGroupe";
import { FiMessageSquare, FiSettings } from "react-icons/fi";

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

                    // Vérifier si l'utilisateur est un participant
                    if (!groupData.participants.includes(userId)) {
                        console.error("Vous n'êtes pas membre de ce groupe !");
                        navigate("/dashboard"); // Rediriger vers le tableau de bord si l'utilisateur n'est pas dans le groupe
                    }
                } else {
                    console.error("Groupe non trouvé !");
                    navigate("/dashboard"); // Rediriger vers le tableau de bord si le groupe n'existe pas
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

    useEffect(() => {
        console.log("User ID:", userId);
    }, [userId]);
    

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
        <div className="min-h-screen bg-gray-100">
            {/* Navbar */}
            <nav className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <Link to="/" className="text-4xl font-extrabold text-blue-500">Coplanify</Link>
                    <div className="flex items-center space-x-8">
                        <ul className="flex space-x-6">
                            <li>
                                <Link to="/dashboard" className="text-lg text-gray-700 hover:text-gray-900 transition">
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link to="/voyages" className="text-lg text-gray-700 hover:text-gray-900 transition">
                                    Voyages
                                </Link>
                            </li>
                            <li>
                                <Link to="/groupes" className="text-lg text-blue-500 font-semibold">
                                    Groupes
                                </Link>
                            </li>
                            <li>
                                <Link to="/profil" className="text-lg text-gray-700 hover:text-gray-900 transition">
                                    Profil
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
    
            {/* Main Layout */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-72 bg-white shadow-lg border-r border-gray-200 flex flex-col p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">{groupName}</h2>
                    
                    <nav className="space-y-4">
                        
                        <button
                            onClick={() => setActiveTab("chat")}
                            className={`flex items-center text-lg font-medium px-3 py-2 rounded-lg transition duration-300 ${
                                activeTab === "chat" ? "text-blue-500" : "text-gray-700"
                            }`}
                        >
                            <FiMessageSquare className="mr-3 text-2xl" />
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab("sondages")}
                            className={`flex items-center text-lg font-medium px-3 py-2 rounded-lg transition duration-300 ${
                                activeTab === "sondages" ? "text-blue-500" : "text-gray-700"
                            }`}
                        >
                            <FiSettings className="mr-3 text-2xl" />
                            Sondages
                        </button>
                        {createur === userId && (
                            <button
                                onClick={() => setActiveTab("parametres")}
                                className={`flex items-center text-lg font-medium px-3 py-2 rounded-lg transition duration-300 ${
                                    activeTab === "parametres" ? "text-blue-500" : "text-gray-700"
                                }`}
                            >
                                <FiSettings className="mr-3 text-2xl" />
                                Paramètres
                            </button>
                        )}
                        {createur !== userId && (
                            <button
                                onClick={handleLeaveGroup}
                                className="w-full text-left text-lg font-medium text-red-500 hover:text-red-700 transition duration-300"
                            >
                                Quitter le groupe
                            </button>
                        )}
                    </nav>
                </aside>
    
                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-100">
                    <div
                        className="relative w-full max-w-5xl bg-white shadow-2xl rounded-2xl p-8 mt-12 mb-12"
                        style={{ minHeight: "75vh" }}
                    >
                        {/* Background Image Effect */}
                        <div
                            className="absolute inset-0 rounded-2xl"
                            style={{
                                backgroundImage: activeTab === "chat" ? "url('/chat1.jpg')" : "url('/sondage1.jpg')",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                opacity: "0.15",
                            }}
                        ></div>
    
                        {/* Content Overlay */}
                        <div className="relative z-10">
                            {activeTab === "chat" && groupeId && userId && <Chat groupeId={groupeId} userId={userId} />}
                            {activeTab === "sondages" && groupeId && <Sondage groupeId={groupeId} />}
                            {activeTab === "parametres" && groupeId && <ParamsGroupe groupeId={groupeId} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    

};

export default GroupPage;
