import { useState, useEffect } from "react";
import {
    doc,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getFirestore,
    deleteDoc,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { app } from "../config/firebase-config";
import { FiTrash, FiClipboard } from "react-icons/fi";
import PropTypes from "prop-types";

const ParamsGroupe = ({ groupId }) => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const currentUserUid = auth.currentUser ? auth.currentUser.uid : null;
    const [groupData, setGroupData] = useState(null);
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newParticipant, setNewParticipant] = useState("");
    const [participantsData, setParticipantsData] = useState([]);
    const [notification, setNotification] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        if (!groupId) return;

        const unsubscribe = onSnapshot(doc(db, "groups", groupId), async (docSnap) => {
            if (docSnap.exists()) {
                const groupInfo = docSnap.data();
                setGroupData(groupInfo);
                setNewName(groupInfo.name);
                setNewDescription(groupInfo.description);

                if (groupInfo.participants?.length > 0) {
                    await fetchParticipantsNames(groupInfo.participants);
                } else {
                    setParticipantsData([]);
                }
            } else {
                setNotification({ type: "error", message: "Groupe introuvable." });
            }
        });

        return () => unsubscribe();
    }, [groupId, db]);



    useEffect(() => {
        if (!currentUserUid) return;

        const fetchUserFriends = async () => {
            try {

                const amisRef = collection(db, "users", currentUserUid, "amis");
                const amisSnapshot = await getDocs(amisRef);

                const friendProfiles = await Promise.all(
                    amisSnapshot.docs.map(async (docSnap) => {
                        const amiData = docSnap.data();

                        const q = query(
                            collection(db, "users"),
                            where("uid", "==", amiData.uid)
                        );
                        const querySnapshot = await getDocs(q);

                        if (!querySnapshot.empty) {
                            const friendDoc = querySnapshot.docs[0];
                            return {
                                docId: friendDoc.id,
                                ...friendDoc.data(),
                            };
                        } else {
                            return null;
                        }
                    })
                );

                const filtered = friendProfiles.filter((f) => f !== null);

                setFriendsList(filtered);
            } catch (error) {
                console.error("Erreur lors de la récupération des amis :", error);
            }
        };

        fetchUserFriends();
    }, [currentUserUid, db]);


    const fetchParticipantsNames = async (uids) => {
        try {
            if (!uids || uids.length === 0) return;

            const usersRef = collection(db, "users");
            const participantsQuery = query(usersRef, where("uid", "in", uids));
            const querySnapshot = await getDocs(participantsQuery);

            const participants = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setParticipantsData(participants);
        } catch (error) {
            console.error("Erreur lors de la récupération des participants :", error);
        }
    };



    const handleSaveChanges = async () => {
        if (!groupData || auth.currentUser?.uid !== groupData.createur) {
            setNotification({ type: "error", message: "Vous n'avez pas la permission." });
            return;
        }

        try {
            await updateDoc(doc(db, "groups", groupId), {
                name: newName,
                description: newDescription
            });

            setNotification({ type: "success", message: "Modifications enregistrées !" });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error("Erreur de mise à jour :", error);
            setNotification({ type: "error", message: "Erreur lors de la mise à jour." });
        }
    };

    const handleAddParticipant = async () => {
        if (!newParticipant.trim()) return;
        if (!groupData || auth.currentUser?.uid !== groupData.createur) {
            setNotification({ type: "error", message: "Vous n'avez pas la permission." });
            return;
        }

        try {
            await updateDoc(doc(db, "groups", groupId), {
                participants: arrayUnion(newParticipant)
            });

            setNewParticipant("");
            setNotification({ type: "success", message: "Participant ajouté !" });

            fetchParticipantsNames([...groupData.participants, newParticipant]);
        } catch (error) {
            console.error("Erreur d'ajout :", error);
            setNotification({ type: "error", message: "Erreur lors de l'ajout." });
        }
    };

    const handleRemoveParticipant = async (uid) => {
        if (!groupData || auth.currentUser?.uid !== groupData.createur) {
            setNotification({ type: "error", message: "Vous n'avez pas la permission." });
            return;
        }

        try {
            await updateDoc(doc(db, "groups", groupId), {
                participants: arrayRemove(uid)
            });

            setNotification({ type: "success", message: "Participant supprimé !" });
        } catch (error) {
            console.error("Erreur de suppression :", error);
            setNotification({ type: "error", message: "Erreur lors de la suppression." });
        }
    };

    const handleDeleteGroup = async () => {
        if (!groupData || auth.currentUser?.uid !== groupData.createur) {
            setNotification({ type: "error", message: "Vous n'avez pas la permission de supprimer ce groupe." });
            return;
        }

        const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce groupe ?");
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, "groups", groupId));
            navigate("/");
            setNotification({ type: "success", message: "Groupe supprimé avec succès !" });
        } catch (error) {
            console.error("Erreur lors de la suppression du groupe :", error);
            setNotification({ type: "error", message: "Erreur lors de la suppression." });
        }
    };

    const handleCopygroupId = () => {
        if (!groupId) {
            setNotification({ type: "error", message: "ID du groupe introuvable !" });
            return;
        }

        navigator.clipboard.writeText(groupId);
        setNotification({ type: "success", message: `ID du groupe copié !` });

        // Reset apres 2 seconds
        setTimeout(() => setNotification(null), 2000);
    };

    return (

        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center text-blue-500 mb-6">
                Paramètres du Groupe
            </h1>

            {notification && (
                <div className={`mb-2 p-3 rounded text-white text-center ${notification.type === "success" ? "bg-green-500" : "bg-red-500"
                    }`}>
                    {notification.message}
                </div>
            )}

            <div className="bg-white p-6 shadow-md rounded-lg border border-gray-300" style={{ maxHeight: '85vh' }}>
                <h2 className="text-2xl font-semibold mb-2">Modifier le groupe</h2>

                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-3 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom du groupe"
                />

                <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full p-3 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description du groupe"
                />

                <button
                    onClick={handleSaveChanges}
                    className="w-full py-2 mb-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                    Enregistrer les modifications
                </button>

                <button
                    onClick={handleCopygroupId}
                    className="w-full py-2 mb-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center justify-center"
                >
                    <FiClipboard className="mr-2" /> Copier l ID du Groupe
                </button>

                {auth.currentUser?.uid === groupData?.createur && (
                    <button
                        onClick={handleDeleteGroup}
                        className="w-full py-2 mb-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center"
                    >
                        <FiTrash className="mr-2" /> Supprimer le groupe
                    </button>
                )}
            </div>

            <div className="bg-white p-6 shadow-md rounded-lg border border-gray-300 mt-6 overflow-y-auto h-[30vh] " style={{ maxHeight: '15vh' }}>
                <h3 className="text-2xl font-semibold mb-2">Participants</h3>

                {participantsData.length > 0 ? (
                    <ul className="mb-2 border p-3 rounded-lg bg-gray-100 overflow-auto">
                        {participantsData.map((participant) => (
                            <li key={participant.uid} className="flex justify-between items-center py-1">
                                <span className="text-gray-700">
                                    {participant.prenom} {participant.nom}
                                </span>
                                {participant.uid !== currentUserUid && (
                                    <button
                                        onClick={() => handleRemoveParticipant(participant.uid)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Kick
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center">Aucun participant</p>
                )}

                <div className="flex gap-2 items-center">
                    <select
                        value={newParticipant}
                        onChange={(e) => setNewParticipant(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Sélectionnez un ami...</option>
                        {friendsList.map((friend) => (
                            <option key={friend.uid} value={friend.uid}>
                                {/* diplay nom et prenom*/}
                                {friend.prenom} {friend.nom}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleAddParticipant}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                        Ajouter
                    </button>
                </div>

            </div>
        </div>
    );
};


ParamsGroupe.propTypes = {
    groupId: PropTypes.string.isRequired,
}

export default ParamsGroupe;
