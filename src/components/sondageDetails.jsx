import  { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import { db } from "../config/firebase-config";
import { getAuth } from "firebase/auth";
import { ArrowLeft } from "react-feather"; // Back icon

const SondageDetails = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!pollId || !userId) return;

    const pollRef = doc(db, "sondages", pollId);

    // Listen to real-time updates on the poll document
    const unsubscribe = onSnapshot(
      pollRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const pollData = { id: docSnap.id, ...docSnap.data() };

          // Update the poll state
          setPoll(pollData);

          // Check if the user has already voted by seeing if userId exists in userVotes
          const userVoteIndex = pollData.userVotes?.[userId];
          setHasVoted(userVoteIndex !== undefined);

          setError(null);
        } else {
          setError("Ce sondage n'existe pas.");
        }
        setLoading(false);
      },
      () => {
        setError("Erreur de chargement du sondage.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pollId, userId]);

  // Just for debugging, to see when hasVoted changes:
  useEffect(() => {
    console.log("User has voted:", hasVoted);
  }, [hasVoted]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Chargement du sondage...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
        <button
          onClick={() => navigate("/sondages")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retour aux sondages
        </button>
      </div>
    );
  }

  if (!poll) return null;

  const totalVotes = poll.votes?.reduce((sum, count) => sum + count, 0) || 0;
  const isExpired = poll.expiration ? new Date() > poll.expiration.toDate() : false;

  const handleVote = async (selectedOptionIndex) => {
    if (hasVoted || isExpired || !userId) return;

    try {
      const updatedVotes = [...poll.votes];
      updatedVotes[selectedOptionIndex] += 1;

      const pollRef = doc(db, "sondages", pollId);
      await updateDoc(pollRef, {
        votes: updatedVotes,
        [`userVotes.${userId}`]: selectedOptionIndex,
      });

      // Optionally, you could set hasVoted here, but it's also handled in the snapshot listener
      setHasVoted(true);
    } catch (error) {
      console.error("Erreur lors du vote :", error);
      alert("Une erreur est survenue lors de votre vote.");
    }
  };

  const handleRemoveVote = async () => {
    if (!hasVoted || isExpired || !userId) return;

    try {
      // Determine which option the user voted for
      const userVoteIndex = poll.userVotes?.[userId];
      if (userVoteIndex === undefined) return;

      const updatedVotes = [...poll.votes];
      if (updatedVotes[userVoteIndex] > 0) {
        updatedVotes[userVoteIndex] -= 1;
      }

      const pollRef = doc(db, "sondages", pollId);
      await updateDoc(pollRef, {
        votes: updatedVotes,
        [`userVotes.${userId}`]: deleteField(),
      });

      // The snapshot listener will also catch this and set hasVoted(false).
      setHasVoted(false);
    } catch (error) {
      console.error("Erreur lors du retrait du vote :", error);
      alert("Impossible d'annuler le vote.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="mr-2" /> Retour aux sondages
        </button>
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mb-6">{poll.question}</h2>

      {isExpired && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          Ce sondage est clôturé depuis le {poll.expiration.toDate().toLocaleDateString()}.
        </div>
      )}

      <div className="space-y-6">
        {poll.options.map((option, index) => {
          const percentage = totalVotes > 0 ? (poll.votes[index] / totalVotes) * 100 : 0;

          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={hasVoted || isExpired}
              className={`flex w-full justify-between items-center p-4 border rounded-lg transition ${
                hasVoted || isExpired
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <span>{option}</span>
              <span className="text-sm">
                {poll.votes[index]} votes ({percentage.toFixed(1)}%)
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {hasVoted && !isExpired && (
          <button
            onClick={handleRemoveVote}
            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Annuler mon vote
          </button>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Total des votes : {totalVotes} participation{totalVotes > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default SondageDetails;
