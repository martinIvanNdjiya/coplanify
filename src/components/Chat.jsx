import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  collection,
  getDoc,
  doc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase-config";
import { FiSend } from "react-icons/fi";

const Chat = ({ groupeId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [groupeData, setGroupeData] = useState(null);

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
        date: serverTimestamp(),
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

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const messagesArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesArray);

      // Récupérer les données des utilisateurs
      const uniqueUserIds = [...new Set(messagesArray.map((msg) => msg.idUtilisateur))];
      const usersInfo = {};

      for (const uid of uniqueUserIds) {
        const q = query(collection(db, "users"), where("uid", "==", uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          usersInfo[uid] = querySnapshot.docs[0].data();
        }
      }
      setUsersData(usersInfo);
    });

    return () => unsubscribe();
  }, [groupeId]);

  return (
    <div className="flex flex-col items-center w-full h-screen ">
      {/* Chat Container */}
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-md border border-gray-300 rounded-xl shadow-lg overflow-hidden h-[500px] flex flex-col">
        
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 text-center border-b border-gray-300">
          <h2 className="text-lg font-semibold">{groupeData?.name || "Chargement du groupe..."}</h2>
        </div>

        {/* Messages avec scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length ? (
            messages.map((message) => {
              const sender = usersData[message.idUtilisateur] || {};
              return (
                <div key={message.id} className={`flex items-start space-x-3 ${message.idUtilisateur === userId ? "justify-end" : "justify-start"}`}>
                  {message.idUtilisateur !== userId ? (
                    <img
                      src={sender.photoProfil || "./user.jpg"}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-blue-500"
                    />
                  ) : (
                    <img
                      src={usersData[userId]?.photoProfil || "./user.jpg"}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-blue-500"
                    />
                  )}
                  <div className="flex flex-col">
                    {message.idUtilisateur !== userId ? (
                      <p className="text-sm font-semibold text-gray-700">{sender.prenom} {sender.nom}</p>
                    ) : (
                      <p className="text-sm font-semibold text-gray-700">{usersData[userId]?.prenom} {usersData[userId]?.nom}</p>
                    )}
                    <div className={`p-3 rounded-xl max-w-[100%] shadow-md ${message.idUtilisateur === userId ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-900"}`}>
                      <p className="text-sm">{message.message}</p>
                      <span className="text-xs opacity-70">
                        {message.date ? new Date(message.date.toDate()).toLocaleTimeString() : "Chargement..."}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-600 text-sm py-4">Aucun message...</div>
          )}
        </div>

        {/* Input Box */}
        <div className="p-4 bg-white border-t border-gray-300 flex items-center">
          <input
            type="text"
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="ml-4 bg-blue-500 text-white p-3 rounded-full shadow-md hover:bg-blue-600 transition-transform duration-200 transform hover:scale-110"
          >
            <FiSend className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

Chat.propTypes = {
  groupeId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};

export default Chat;