import  { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    collection,
    getDoc,
    doc,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase-config";

const Chat = ({ groupeId, userId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [groupeData, setGroupeData] = useState(null);
    const navigate = useNavigate();

    const navigateDashboard = () => {
        navigate("/dashboard");
    };

    useEffect(() => {
        if (!groupeId) {
            console.error("Invalid group ID provided!");
            return;
        }

        const fetchGroupData = async () => {
            try {
                const docRef = doc(db, "groups", groupeId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setGroupeData(docSnap.data());
                } else {
                    console.error("Group does not exist!");
                }
            } catch (error) {
                console.error("Error fetching group data:", error);
            }
        };

        fetchGroupData();
    }, [groupeId]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !groupeId || !userId) return;

        try {
            const messagesRef = collection(db, `groups/${groupeId}/messages`);
            await addDoc(messagesRef, {
                idUtilisateur: userId,
                message: newMessage.trim(),
                envoye: true,
                date: serverTimestamp(),
                fichierEnvoye: null,
            });
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    useEffect(() => {
        if (!groupeId) return;

        const messagesRef = collection(db, `groups/${groupeId}/messages`);
        const messagesQuery = query(messagesRef, orderBy("date", "asc"));

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesArray = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(messagesArray);
        });

        return () => unsubscribe();
    }, [groupeId]);

    if (!groupeId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500 text-lg font-semibold">
                    Aucun groupe Id...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col max-w-2xl w-full h-screen mx-auto border border-gray-300 rounded-xl shadow-xl overflow-hidden bg-white">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 flex items-center justify-between">
                <button onClick={navigateDashboard} className="mr-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6 text-white hover:text-gray-200"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h2>{groupeData?.name || "Loading group..."}</h2>
                <span className="text-sm font-light opacity-80">
                    Membre actif: {groupeData?.participants?.length || 0}
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-100 break-words">
                {messages.length ? (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.idUtilisateur === userId ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`p-3 rounded-xl max-w-[75%] shadow-md ${message.idUtilisateur === userId
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-300 text-gray-900"
                                    }`}
                            >
                                <p>{message.message}</p>
                                <span className="text-xs text-gray-500">
                                    {message.date
                                        ? new Date(message.date.toDate()).toLocaleString()
                                        : "Loading..."}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center mt-4">Aucun message...</p>
                )}
            </div>

            {/* Input Box */}
            <div className="flex items-center p-4 bg-white border-t border-gray-300">
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleSendMessage}
                    className="ml-4 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-transform duration-200 transform hover:scale-105"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
