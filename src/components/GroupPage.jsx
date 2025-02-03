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
    const [createur, setcreateur] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("chat");
    const navigate = useNavigate();
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                const groupsRef = collection(db, "groups");
                const q = query(groupsRef, where("name", "==", groupName));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const groupDoc = querySnapshot.docs[0];
                    setGroupeId(groupDoc.id);
                    setcreateur(groupDoc.data().createur);
                } else {
                    console.error("Group not found!");
                    navigate("/dashboard");
                }
            } catch (error) {
                console.error("Error fetching group data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupData();
    }, [groupName, navigate]);

    const handleLeaveGroup = async () => {
        const confirmLeave = window.confirm("Êtes-vous sûr de vouloir quitter ce groupe ?");
        if (confirmLeave) {
            try {
                const groupRef = doc(db, "groups", groupeId);
                await updateDoc(groupRef, {
                    members: arrayRemove(userId)
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
                <p className="text-gray-500 text-lg font-semibold">Loading group...</p>
            </div>
        );
    }

    if (!groupeId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500 text-lg font-semibold">Groupe pas trouver!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Navbar */}
            <nav className="bg-white shadow-md w-full px-8 py-4 flex items-center justify-between border-b border-gray-300">
                <Link to="/" className="text-4xl font-extrabold text-blue-500">Coplanify</Link>
                <div className="flex space-x-8 mr-20">
                    <Link to="/dashboard" className="text-lg text-gray-700 hover:text-gray-900">Accueil</Link>
                    <Link to="/voyages" className="text-lg text-gray-700 hover:text-gray-900">Voyages</Link>
                    <Link to="/amis" className="text-lg text-gray-700 hover:text-gray-900">Amis</Link>
                    <Link to="/profil" className="text-lg text-gray-700 hover:text-gray-900">Profil</Link>
                </div>
            </nav>

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-300 flex flex-col pt-4">
                    <nav className="flex-1 px-4 py-6 space-y-4">
                        {createur !== userId && (
                            <button
                                onClick={handleLeaveGroup}
                                className="w-full text-left text-lg font-medium text-red-500 hover:text-red-700 transition duration-300"
                            >
                                Quitter le groupe
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab("chat")}
                            className={`flex items-center text-lg font-medium ${activeTab === "chat" ? "text-blue-500" : "text-gray-700"} hover:text-blue-500 transition duration-300`}
                        >
                            <FiMessageSquare className="mr-3 text-2xl" />
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab("sondages")}
                            className={`flex items-center text-lg font-medium ${activeTab === "sondages" ? "text-blue-500" : "text-gray-700"} hover:text-blue-500 transition duration-300`}
                        >
                            <FiSettings className="mr-3 text-2xl" />
                            Sondages
                        </button>
                        {createur === userId && (
                            <button
                                onClick={() => setActiveTab("parametres")}
                                className={`flex items-center text-lg font-medium ${activeTab === "parametres" ? "text-blue-500" : "text-gray-700"} hover:text-blue-500 transition duration-300`}
                            >
                                <FiSettings className="mr-3 text-2xl" />
                                Paramètres
                            </button>
                        )}
                    </nav>
                </aside>

                {/* Main Content */}
                <div
                    className="flex-1 p-6 bg-cover bg-center"
                    style={{ backgroundImage: activeTab === "chat" ? "url('/chat1.jpg')" : "url('/sondage1.jpg')" }}
                >
                    {activeTab === "chat" && <Chat groupeId={groupeId} userId={userId} />}
                    {activeTab === "sondages" && <Sondage groupeId={groupeId} />}
                    {activeTab === "parametres" && <ParamsGroupe groupeId={groupeId} />}
                </div>
            </div>
        </div>
    );
};

export default GroupPage;
