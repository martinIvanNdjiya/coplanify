import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { collection, addDoc, updateDoc, getDocs, query, where, getFirestore, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../config/firebase-config";

const CreateGroup = ({ onClose }) => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [friends, setFriends] = useState([]);
  const [notification, setNotification] = useState(null);
  

  useEffect(() => {
    const fetchFriends = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Obtenir le document de l'utilisateur actuel
          const q = query(collection(db, "users"), where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const currentUserDoc = querySnapshot.docs[0];
            const currentUserId = currentUserDoc.id;

            // Obtenir la liste des amis de l'utilisateur actuel
            const friendsRef = collection(db, "users", currentUserId, "amis");
            const friendsSnapshot = await getDocs(friendsRef);

            const friendsList = [];
            for (const friendDoc of friendsSnapshot.docs) {
              const friendData = friendDoc.data();

              // Récupérer les informations complètes de chaque ami
              const friendQuery = query(collection(db, "users"), where("uid", "==", friendData.uid));
              const friendSnapshot = await getDocs(friendQuery);

              if (!friendSnapshot.empty) {
                const friendInfo = friendSnapshot.docs[0].data();
                friendsList.push({ id: friendSnapshot.docs[0].id, ...friendInfo });
              }
            }
            setFriends(friendsList);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des amis :", error);
        }
      }
    };

    fetchFriends();
  }, [auth, db]);

  const handleCreateGroup = async () => {
    if (!groupName || !groupDescription) {
      setNotification({ type: "error", message: "Tous les champs sont requis." });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Ajouter le créateur dans la liste des participants
      const allParticipants = [...selectedParticipants.map((p) => p.uid), user.uid];

      // Créer le groupe avec les informations nécessaires
      const newGroupRef = await addDoc(collection(db, "groups"), {
        name: groupName,
        description: groupDescription,
        participants: allParticipants,
        createur: user.uid,
        createdAt: serverTimestamp(), // Date de création pour le tri
        icon: "default-group-icon.png" // Icône par défaut du groupe
      });

      await updateDoc(newGroupRef, { id: newGroupRef.id });

      console.log("Groupe créé avec ID:", newGroupRef.id);

      setNotification({ type: "success", message: "Le groupe a été créé avec succès !" });
      setTimeout(() => setNotification(null), 3000);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création du groupe :", error);
      setNotification({ type: "error", message: "Une erreur est survenue lors de la création du groupe." });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Créer un nouveau groupe</h2>

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
          placeholder="Nom du groupe"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
        />

        <textarea
          placeholder="Description du groupe"
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
        />

        {/* Sélection des participants */}
        <label className="block text-lg font-semibold text-gray-700 mb-2">Ajouter un ami</label>
        <select
          multiple
          value={selectedParticipants.map((p) => p.uid)}
          onChange={(e) =>
            setSelectedParticipants(
              [...e.target.options]
                .filter((option) => option.selected)
                .map((option) => friends.find((f) => f.uid === option.value))
            )
          }
          className="w-full p-3 border border-gray-300 rounded-lg h-32 overflow-auto"
        >
          {friends.map((friend) => (
            <option key={friend.uid} value={friend.uid}>
              {friend.prenom} {friend.nom}
            </option>
          ))}
        </select>

        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
            Annuler
          </button>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
};

CreateGroup.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default CreateGroup;
