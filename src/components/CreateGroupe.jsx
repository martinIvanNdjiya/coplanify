import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebase-config";

const CreateGroup = ({ onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [groupDates, setGroupDates] = useState("");

    const handleCreateGroup = async () => {
        if (groupName && groupDescription && groupDates) {
            try {
                await addDoc(collection(db, "groups"), {
                    name: groupName,
                    description: groupDescription,
                    dates: groupDates,
                    participants: [],
                });
                onClose();
            } catch (error) {
                console.error("Error creating group:", error);
            }
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h2 className="text-2xl font-bold mb-4">Créer un nouveau groupe</h2>
                <input
                    type="text"
                    placeholder="Nom du groupe"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                />
                <textarea
                    placeholder="Description du groupe"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                />
                <input
                    type="text"
                    placeholder="Dates (ex. 20-30 Mars 2025)"
                    value={groupDates}
                    onChange={(e) => setGroupDates(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                />
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleCreateGroup}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        Créer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroup;
