import React, { useState, useEffect } from "react";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase-config";
import { getAuth } from "firebase/auth";

const Sondage = () => {
    const [polls, setPolls] = useState([]);
    const [newPoll, setNewPoll] = useState("");
    const [options, setOptions] = useState([""]);
    const [isCreating, setIsCreating] = useState(false);
    const auth = getAuth();

    useEffect(() => {
        const pollsRef = collection(db, "sondages");
        const pollsQuery = query(pollsRef, orderBy("date", "desc"));

        const unsubscribe = onSnapshot(pollsQuery, (snapshot) => {
            const pollData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPolls(pollData);
        });

        return () => unsubscribe();
    }, []);

    const handleAddPoll = async () => {
        if (!newPoll.trim() || options.some((opt) => !opt.trim())) {
            alert("Please provide a question and valid options.");
            return;
        }

        try {
            const pollsRef = collection(db, "sondages");
            await addDoc(pollsRef, {
                question: newPoll.trim(),
                options: options.map((opt) => opt.trim()),
                votes: Array(options.length).fill(0),
                votedBy: [],
                creator: auth.currentUser?.uid,
                date: serverTimestamp(),
            });

            setNewPoll("");
            setOptions([""]);
            setIsCreating(false);
        } catch (error) {
            console.error("Error creating poll:", error);
        }
    };

    const handleVote = async (pollId, selectedOptionIndex) => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            alert("You need to be logged in to vote.");
            return;
        }

        const poll = polls.find((p) => p.id === pollId);
        if (!poll) return;

        if (poll.votedBy.includes(userId)) {
            alert("You have already voted on this poll.");
            return;
        }

        try {
            const pollDocRef = doc(db, "sondages", pollId);
            const updatedVotes = [...poll.votes];
            updatedVotes[selectedOptionIndex] += 1;

            await updateDoc(pollDocRef, {
                votes: updatedVotes,
                votedBy: arrayUnion(userId),
            });
        } catch (error) {
            console.error("Error submitting vote:", error);
        }
    };

    const handleRemoveVote = async (pollId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            alert("You need to be logged in to remove your vote.");
            return;
        }

        const poll = polls.find((p) => p.id === pollId);
        if (!poll || !poll.votedBy.includes(userId)) return;

        try {
            const pollDocRef = doc(db, "sondages", pollId);
            const userVoteIndex = poll.votes.findIndex((vote) => vote > 0);
            if (userVoteIndex !== -1) {
                const updatedVotes = [...poll.votes];
                updatedVotes[userVoteIndex] -= 1;

                await updateDoc(pollDocRef, {
                    votes: updatedVotes,
                    votedBy: arrayRemove(userId),
                });
            }
        } catch (error) {
            console.error("Error removing vote:", error);
        }
    };

    const handleDeletePoll = async (pollId) => {
        try {
            const pollDocRef = doc(db, "sondages", pollId);
            await deleteDoc(pollDocRef);
        } catch (error) {
            console.error("Error deleting poll:", error);
        }
    };

    const handleAddOption = () => {
        setOptions([...options, ""]);
    };

    const handleRemoveOption = (index) => {
        if (options.length > 1) {
            const updatedOptions = options.filter((_, i) => i !== index);
            setOptions(updatedOptions);
        }
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...options];
        updatedOptions[index] = value;
        setOptions(updatedOptions);
    };

    return (
        <div className="max-w-4xl mx-auto mt-8">
            <h1 className="text-4xl font-bold text-center text-blue-500 mb-6">
                Sondages
            </h1>

            {isCreating ? (
                <div className="bg-white p-6 shadow-md rounded-lg mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Créer un nouveau sondage</h2>
                    <input
                        type="text"
                        value={newPoll}
                        onChange={(e) => setNewPoll(e.target.value)}
                        placeholder="Entrez la question du sondage..."
                        className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <button
                        onClick={handleAddOption}
                        className="mt-4 px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition duration-300"
                    >
                        Ajouter une option
                    </button>
                    <button
                        onClick={handleAddPoll}
                        className="mt-4 ml-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
                    >
                        Créer le sondage
                    </button>
                    <button
                        onClick={() => setIsCreating(false)}
                        className="mt-4 ml-4 px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
                    >
                        Annuler
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsCreating(true)}
                    className="mb-8 px-6 py-3 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition duration-300"
                >
                    Créer un nouveau sondage
                </button>
            )}

            {polls.length ? (
                polls.map((poll) => {
                    const totalVotes = poll.votes.reduce((sum, v) => sum + v, 0);
                    const userId = auth.currentUser?.uid;

                    return (
                        <div
                            key={poll.id}
                            className="mb-8 p-6 bg-white shadow-md rounded-lg border border-gray-300"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-semibold mb-4">{poll.question}</h2>
                                {poll.creator === userId && (
                                    <button
                                        onClick={() => handleDeletePoll(poll.id)}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className="w-6 h-6"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 2.25h6M19.5 5.25h-15M10.5 9.75v6M13.5 9.75v6M4.5 5.25H19.5M6 5.25l1.5 15h9L18 5.25"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const selectedOption = new FormData(e.target).get("vote");
                                    const selectedOptionIndex = Number(selectedOption);
                                    if (selectedOptionIndex !== -1) {
                                        handleVote(poll.id, selectedOptionIndex);
                                    }
                                }}
                                className="flex flex-col gap-4"
                            >
                                {poll.options.map((option, index) => {
                                    const percentage =
                                        totalVotes > 0 ? Math.floor((poll.votes[index] / totalVotes) * 100) : 0;

                                    return (
                                        <div key={index} className="votes">
                                            <input
                                                type="radio"
                                                name="vote"
                                                value={index}
                                                id={`${poll.id}-${index}`}
                                                className="peer hidden"
                                                disabled={poll.votedBy.includes(userId)}
                                            />
                                            <label
                                                htmlFor={`${poll.id}-${index}`}
                                                className={`block p-4 border rounded-md cursor-pointer peer-checked:bg-blue-500 peer-checked:text-white ${poll.votedBy.includes(userId) && "opacity-50"
                                                    }`}
                                            >
                                                <p className="flex justify-between">
                                                    {option} <span>{percentage}%</span>
                                                </p>
                                            </label>
                                        </div>
                                    );
                                })}
                                {poll.votedBy.includes(userId) ? (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveVote(poll.id)}
                                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                    >
                                        Retirer votre vote
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                                    >
                                        Votez
                                    </button>
                                )}
                            </form>

                        </div>
                    );
                })
            ) : (
                <p className="text-center text-gray-500">Aucun sondage disponible.</p>
            )}
        </div>
    );
};

export default Sondage;
