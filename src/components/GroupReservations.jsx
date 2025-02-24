import { useState, useEffect } from "react"; 
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase-config";

const GroupReservations = ({ groupId, userId, groupMembers }) => {
  const [laReservation, setLaReservation] = useState(null);
  const [groupData, setGroupData] = useState(null);

  // Récupération de la réservation (on suppose qu'il n'y en a qu'une par groupe)
  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "reservations"),
      where("groupId", "==", groupId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.docs.length > 0) {
        const res = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };
        setLaReservation(res);
      } else {
        setLaReservation(null);
      }
    });
    return () => unsubscribe();
  }, [groupId]);

  // Récupération des informations du groupe pour obtenir le créateur et le nom du groupe
  useEffect(() => {
    if (!groupId) return;
    const groupRef = doc(db, "groups", groupId);
    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        setGroupData(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [groupId]);

  const calculDureeHeures = (dureeIso) => {
    if (!dureeIso) return 0;
    return dureeIso.replace("PT", "");
  };

  // Fonction pour voter sur la réservation
  const voterReservation = async (nouveauStatut) => {
    if (!laReservation) return;
    try {
      const aVote = laReservation.items.find((item) => item.userId === userId);
      let updatedItems;
      if (aVote && aVote.status === nouveauStatut) {
        updatedItems = laReservation.items.map((item) =>
          item.userId === userId ? { ...item, status: "pending" } : item
        );
      } else if (aVote) {
        updatedItems = laReservation.items.map((item) =>
          item.userId === userId ? { ...item, status: nouveauStatut } : item
        );
      } else {
        updatedItems = [...laReservation.items, { userId, status: nouveauStatut }];
      }
      const reservationRef = doc(db, "reservations", laReservation.id);
      await updateDoc(reservationRef, { items: updatedItems });
    } catch (error) {
      console.error("Erreur lors du vote :", error);
    }
  };

  const confirmedCount = laReservation
    ? laReservation.items.filter((item) => item.status === "confirmed").length
    : 0;
  const cancelledCount = laReservation
    ? laReservation.items.filter((item) => item.status === "cancel").length
    : 0;
  const changeCount = laReservation
    ? laReservation.items.filter((item) => item.status === "change").length
    : 0;
  const pendingCount = laReservation
    ? laReservation.items.filter(
        (item) => !item.status || item.status === "pending"
      ).length
    : 0;
  const totalVotants = laReservation ? laReservation.items.length : 0;
  const currentVote = laReservation
    ? laReservation.items.find((item) => item.userId === userId)?.status
    : null;

  const nonVotes =
    groupMembers && laReservation
      ? groupMembers.filter(
          (m) => !laReservation.items.some((item) => item.userId === m.uid)
        )
      : [];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Réservation de groupe</h3>
      {laReservation ? (
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">
                Vol {laReservation.destination ? laReservation.destination : ""}
              </h4>
            </div>
            <span className="text-sm text-gray-500">
              Statut général : {laReservation.status}
            </span>
          </div>
          {/* Informations complémentaires */}
          <div className="mt-2">
            <p className="text-gray-700">
              <span className="text-blue-500 font-semibold">Prix :</span> {laReservation.currency} {laReservation.price}
            </p>
            <p className="text-gray-700">
              <span className="text-blue-500 font-semibold">Départ :</span> {laReservation.departure}
            </p>
            <p className="text-gray-700">
              <span className="text-blue-500 font-semibold">Arrivée :</span> {laReservation.arrival}
            </p>
            <p className="text-gray-700">
                            <span className="text-blue-500 font-semibold">Durée :</span> {calculDureeHeures(laReservation.duration)}
            </p>
          </div>
          <div className="mt-2 space-y-2">
            {laReservation.items.map((item) => (
              <div key={item.userId} className="flex items-center">
                <span className="flex-1">
                  {/* Vote :{" "} */}
                  {item.status === "confirmed"
                    ? "Confirmé"
                    : item.status === "cancel"
                    ? "Annulé"
                    : item.status === "change"
                    ? "Propose changement"
                    : "En attente"}
                </span>
              </div>
            ))}
            {groupMembers && nonVotes.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-600">
                  Membres n'ayant pas voté :
                </p>
                <ul className="list-disc ml-6">
                  {nonVotes.map((m) => (
                    <li key={m.uid} className="text-sm text-gray-600">
                      {m.prenom} {m.nom}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <button
              onClick={() =>
                voterReservation(currentVote === "confirmed" ? "pending" : "confirmed")
              }
              className={`text-sm px-3 py-1 rounded ${
                currentVote === "confirmed"
                  ? "bg-green-300 text-green-900"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {currentVote === "confirmed" ? "Annuler vote" : "Confirmer"}
            </button>
            <button
              onClick={() =>
                voterReservation(currentVote === "cancel" ? "pending" : "cancel")
              }
              className={`text-sm px-3 py-1 rounded ${
                currentVote === "cancel"
                  ? "bg-red-300 text-red-900"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {currentVote === "cancel" ? "Annuler vote" : "Annuler"}
            </button>
            <button
              onClick={() =>
                voterReservation(currentVote === "change" ? "pending" : "change")
              }
              className={`text-sm px-3 py-1 rounded ${
                currentVote === "change"
                  ? "bg-yellow-300 text-yellow-900"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {currentVote === "change" ? "Annuler vote" : "Proposer changement"}
            </button>
          </div>
          {/* Seul le créateur du groupe peut supprimer la réservation */}
          {groupData?.createur === userId && (
            <div className="mt-4">
              <button
                onClick={async () => {
                  try {
                    const reservationRef = doc(db, "reservations", laReservation.id);
                    await deleteDoc(reservationRef);
                    alert("Réservation supprimée avec succès !");
                  } catch (error) {
                    console.error("Erreur lors de la suppression de la réservation :", error);
                    alert("Erreur lors de la suppression. Veuillez réessayer.");
                  }
                }}
                className="text-sm bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
              >
                Supprimer la réservation
              </button>
            </div>
          )}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progression du groupe :</span>
              <span>
                {confirmedCount}/{totalVotants} confirmés
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{
                  width: `${totalVotants > 0 ? (100 * confirmedCount) / totalVotants : 0}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-700">
            <p>Confirmés : {confirmedCount}</p>
            <p>Annulés : {cancelledCount}</p>
            <p>Changement proposé : {changeCount}</p>
            <p>En attente : {pendingCount}</p>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-700">
          Aucune réservation pour ce groupe.
        </div>
      )}
    </div>
  );
};

export default GroupReservations;
