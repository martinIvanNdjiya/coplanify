import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase-config";
import { getAuth } from "firebase/auth";
import Chat from "./Chat";
import Sondage from "./Sondage";
import { FiMessageSquare, FiSettings } from "react-icons/fi";

const GroupPage = () => {
    const { groupName } = useParams();
    const [groupeId, setGroupeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("chat");
    const navigate = useNavigate();
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchGroupId = async () => {
            try {
                const groupsRef = collection(db, "groups");
                const q = query(groupsRef, where("name", "==", groupName));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const groupDoc = querySnapshot.docs[0];
                    setGroupeId(groupDoc.id);
                } else {
                    console.error("Group not found!");
                    navigate("/dashboard");
                }
            } catch (error) {
                console.error("Error fetching group ID:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupId();
    }, [groupName, navigate]);

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
                <p className="text-red-500 text-lg font-semibold">Group not found!</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <aside className="w-1/4 bg-white border-r border-gray-300">
            <header className="bg-white p-6 border-b border-gray-300">
          <Link to="/" className="text-4xl font-extrabold text-blue-500">Coplanify</Link>
        </header>
            {/* Sidebar */}
                <nav className="flex-1 px-4 py-6 space-y-4">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`flex items-center text-lg font-medium ${
                            activeTab === "chat" ? "text-blue-500" : "text-gray-700"
                        } hover:text-blue-500 transition duration-300`}
                    >
                        <FiMessageSquare className="mr-3 text-2xl" />
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab("sondages")}
                        className={`flex items-center text-lg font-medium ${
                            activeTab === "sondages" ? "text-blue-500" : "text-gray-700"
                        } hover:text-blue-500 transition duration-300`}
                    >
                        <FiSettings className="mr-3 text-2xl" />
                        Sondages
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
                {activeTab === "chat" && <Chat groupeId={groupeId} userId={userId} />}
                {activeTab === "sondages" && <Sondage groupeId={groupeId} />}
            </div>
        </div>
    );
};

export default GroupPage;
