import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, deleteField, addDoc, collection } from "firebase/firestore";
import { db } from "../config/firebase-config";
import { getAuth } from "firebase/auth";
import { ArrowLeft } from "react-feather"; // Back icon
import { useNavigate } from "react-router-dom";

const SondageDetails = ({ groupId, pollId }) => {
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!groupId || !pollId) return;

    const pollRef = doc(db, "groups", groupId, "sondages", pollId);

    const checkPollExpiration = async (pollData) => {
      console.log("Checking poll expiration... ", pollData);
      
      if (pollData.expiration && new Date() > pollData.expiration.toDate()) {
        const winningOptionIndex = pollData.votes.indexOf(Math.max(...pollData.votes));
        const winningOption = pollData.options[winningOptionIndex];
        const message = `Le sondage "${pollData.question}" est clôturé. L'option gagnante est "${winningOption}".`;

        const messagesRef = collection(db, `groups/${groupId}/messages`);
        await addDoc(messagesRef, {
          idUtilisateur: pollData.creator,
          message,
          date: new Date(),
        });
      }
    };

    const unsubscribe = onSnapshot(
      pollRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const pollData = { id: docSnap.id, ...docSnap.data() };
          setPoll(pollData);
          setHasVoted(pollData.userVotes?.[userId] !== undefined);
          setError(null);
          checkPollExpiration(pollData);
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
  }, [groupId, pollId, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Chargement du sondage...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
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

      const pollRef = doc(db, "groups", groupId, "sondages", pollId);
      await updateDoc(pollRef, {
        votes: updatedVotes,
        [`userVotes.${userId}`]: selectedOptionIndex,
      });

      setHasVoted(true);
    } catch (error) {
      console.error("Erreur lors du vote :", error);
      alert("Une erreur est survenue lors de votre vote.");
    }
  };

  const handleRemoveVote = async () => {
    if (!hasVoted || isExpired || !userId) return;

    try {
      const userVoteIndex = poll.userVotes?.[userId];
      if (userVoteIndex === undefined) return;

      const updatedVotes = [...poll.votes];
      if (updatedVotes[userVoteIndex] > 0) {
        updatedVotes[userVoteIndex] -= 1;
      }

      const pollRef = doc(db, "groups", groupId, "sondages", pollId);
      await updateDoc(pollRef, {
        votes: updatedVotes,
        [`userVotes.${userId}`]: deleteField(),
      });

      setHasVoted(false);
    } catch (error) {
      console.error("Erreur lors du retrait du vote :", error);
      alert("Impossible d'annuler le vote.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">{poll.question}</h2>

      {isExpired && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          Ce sondage est clôturé depuis le {poll.expiration.toDate().toLocaleDateString()}.
        </div>
      )}

      <div className="space-y-6 flex-1 overflow-auto">
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
