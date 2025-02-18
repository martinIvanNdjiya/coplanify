import React, { useState, useEffect } from "react";
import { ArrowLeft } from "react-feather";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase-config";
import { getAuth } from "firebase/auth";
import SondageDetails from "./sondageDetails";

const Sondage = ({ groupeId }) => {
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState("");
  const [options, setOptions] = useState([""]);
  const [expirationDate, setExpirationDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const auth = getAuth();
  console.log("groupeId dans Sondage:", groupeId)

  useEffect(() => {
    if (!groupeId) {
      console.error("Aucun groupe sélectionné !");
      return;
    }

    const pollsRef = collection(db, "groups", groupeId, "sondages");
    const pollsQuery = query(pollsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(pollsQuery, (snapshot) => {
      const pollData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPolls(pollData);
    });

    return () => unsubscribe();
  }, [groupeId, db]);

  const isPollExpired = (poll) => {
    if (!poll.expiration) return false;
    const now = new Date();
    const expiration = poll.expiration.toDate();
    return now > expiration;
  };

  const handleAddPoll = async () => {
    if (!groupeId) {
      alert("Erreur : aucun groupe sélectionné.");
      return;
    }

    if (!newPoll.trim() || options.some((opt) => !opt.trim())) {
      alert("Veuillez fournir une question et des options valides.");
      return;
    }

    try {
      const pollsRef = collection(db, "groups", groupeId, "sondages");
      await addDoc(pollsRef, {
        question: newPoll.trim(),
        options: options.map((opt) => opt.trim()),
        votes: Array(options.length).fill(0),
        creator: auth.currentUser?.uid,
        date: serverTimestamp(),
        expiration: new Date(expirationDate),
      });

      setNewPoll("");
      setOptions([""]);
      setExpirationDate("");
      setIsCreating(false);
    } catch (error) {
      console.error("Erreur lors de la création du sondage:", error);
    }
  };

  const handleDeletePoll = async (pollId) => {
    try {
      const pollDocRef = doc(db, "groups", groupeId, "sondages", pollId);
      await deleteDoc(pollDocRef);
    } catch (error) {
      console.error("Erreur lors de la suppression du sondage:", error);
    }
  };

  const handleAddOption = () => setOptions([...options, ""]);

  const handleRemoveOption = (index) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleOpenPoll = (poll) => {
    setSelectedPoll(poll);
  };

  const handleClosePoll = () => {
    setSelectedPoll(null);
  };

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/votre-image.jpg)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[45vh] overflow-y-auto">
          {polls.map((poll) => {
            const totalVotes = poll.votes.reduce((a, b) => a + b, 0);
            const isExpired = isPollExpired(poll);

            return (
              <div 
                key={poll.id}
                className="relative bg-white/90 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-blue-100"
              >
                {isExpired && (
                  <div className="absolute inset-0 bg-red-50/80 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-red-600 font-bold text-lg">Sondage clos</span>
                  </div>
                )}

                <div className={`${isExpired && "opacity-60"}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-blue-800 pr-4">
                      {poll.question}
                    </h3>
                    {poll.creator === auth.currentUser?.uid && (
                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {poll.options.map((option, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-lg">
                        <div className="h-2 bg-blue-100 rounded-full mb-1">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{
                              width: `${(poll.votes[index] / (totalVotes || 1)) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-blue-600">{option}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-sm text-blue-500">
                    <span>
                      {totalVotes} vote{totalVotes > 1 ? "s" : ""}
                    </span>
                    {poll.expiration && (
                      <span>
                        Expire le {poll.expiration.toDate().toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenPoll(poll)}
                    className="mt-4 inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isExpired ? "Voir résultats" : "Participer"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {polls.length === 0 && (
          <p className="text-center text-gray-500 mt-8">
            Aucun sondage disponible pour le moment.
          </p>
        )}

        <div className="flex justify-end mt-8">
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Créer un sondage
          </button>
        </div>

        {isCreating && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-xl shadow-xl border border-blue-100 max-w-lg w-full">
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">Nouveau sondage</h2>
              <input
                type="text"
                value={newPoll}
                onChange={(e) => setNewPoll(e.target.value)}
                placeholder="Question du sondage..."
                className="w-full p-3 border border-blue-200 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="space-y-3 mb-4">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 p-2 border border-blue-200 rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length <= 1}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mb-4">
                <button
                  onClick={handleAddOption}
                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                >
                  + Ajouter une option
                </button>
                
                <input
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  required
                  className="p-2 border border-blue-200 rounded-lg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddPoll}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Publier
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedPoll && (
          <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-100">
            <div className="bg-white p-6 rounded-xl shadow-xl border border-blue-100 max-w-lg w-full h-full">
              <button
                onClick={handleClosePoll}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
              >
                <ArrowLeft className="mr-2" /> Retour aux sondages
              </button>
              <div className="flex-1 overflow-auto">
                <SondageDetails groupId={groupeId} pollId={selectedPoll.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sondage;