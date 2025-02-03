import { useState } from "react";
import PropTypes from "prop-types";
import { doc, getDoc, updateDoc, arrayUnion, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../config/firebase-config";

const JoinGroup = ({ onClose }) => {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [groupId, setGroupId] = useState("");
  const [notification, setNotification] = useState(null);

  const handleJoinGroup = async () => {
    if (!groupId.trim()) {
      setNotification({ type: "error", message: "Veuillez entrer un ID de groupe valide." });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        setNotification({ type: "error", message: "Le groupe n'existe pas. Vérifiez l'ID." });
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      await updateDoc(groupRef, {
        participants: arrayUnion(user.uid)
      });

      setNotification({ type: "success", message: "Vous avez rejoint le groupe avec succès !" });
      setTimeout(() => {
        setNotification(null);
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la jonction du groupe :", error);
      setNotification({ type: "error", message: "Une erreur est survenue, veuillez réessayer." });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Rejoindre un groupe</h2>

        {notification && (
          <div
            className={`mb-4 p-3 rounded text-white text-center ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {notification.message}
          </div>
        )}

        <input
          type="text"
          placeholder="Entrez l'ID du groupe"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
        />

        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
            Annuler
          </button>
          <button
            onClick={handleJoinGroup}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Rejoindre
          </button>
        </div>
      </div>
    </div>
  );
};

JoinGroup.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default JoinGroup;
