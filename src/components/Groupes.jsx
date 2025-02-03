import { Link, useNavigate } from "react-router-dom";
import { FiAirplay, FiUsers, FiLogOut, FiUser, FiSearch, FiMessageSquare } from "react-icons/fi";
import { useEffect, useState } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, query, collection, where, getDocs, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { app } from "../config/firebase-config";
import CreateGroup from "./CreateGroupe";
import JoinGroup from './JoinGroup'
const Groupes = () => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const navigate = useNavigate();
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [groups, setGroups] = useState([]);
    const [connectedFriends, setConnectedFriends] = useState([]);
    const [amis, setAmis] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const q = query(collection(db, "users"), where("uid", "==", user.uid));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const userData = querySnapshot.docs[0].data();
                        setUserProfile(userData);

                        // Récupérer les amis (sous-collection "amis")
                        const amisRef = collection(db, "users", querySnapshot.docs[0].id, "amis");
                        const amisSnapshot = await getDocs(amisRef);
                        const amisList = amisSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

                        console.log("Profil utilisateur :", userData);
                        console.log("Liste des amis :", amisList);

                        setAmis(amisList);
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération du profil utilisateur :", error);
                }
            } else {
                // Si l'utilisateur n'est pas connecté, redirige vers la page d'accueil
                navigate("/");
            }
        });

        return () => unsubscribe(); // Nettoie le listener lors du démontage du composant
    }, [auth, db, navigate]);


useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
        console.log("User is not logged in");
        return;
    }

    const groupsRef = collection(db, "groups");
    const groupsQuery = query(groupsRef, where("participants", "array-contains", user.uid));

    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
        const groupData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        console.log("Real-time groups:", groupData);
        setGroups(groupData);
    });

    return () => unsubscribe();
}, [db]);


    useEffect(() => {
        const fetchConnectedFriends = async () => {
            if (userProfile && amis) {
                const friendsPromises = amis.map(async (amiUid) => {
                    const q = query(collection(db, "users"), where("uid", "==", amiUid.uid));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const friendData = querySnapshot.docs[0].data();
                        if (friendData.online) {
                            return friendData;
                        }
                    }
                    return null;
                });

                const friends = await Promise.all(friendsPromises);
                setConnectedFriends(friends.filter((friend) => friend !== null));
            }
        };

        fetchConnectedFriends();
    }, [userProfile, db, amis]);

    const handleLogout = async () => {
        try {
            const userId = userProfile.uid;
            const db = getFirestore(app);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('uid', '==', userId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, 'users', userDoc.id), {
                    online: false
                });
            }

            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Erreur lors de la déconnexion :', error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Header et Barre latérale intégrés */}
            <aside className="fixed top-0 left-0 h-full w-64 bg-white flex flex-col">
                {/* Header combiné */}
                <header className="bg-white p-6 border-b border-gray-300">
                    <Link to="/" className="text-4xl font-extrabold text-blue-500">Coplanify</Link>
                </header>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-4">
                    <Link to="/voyages" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
                        <FiAirplay className="mr-3 text-2xl" />
                        Voyages
                    </Link>
                    <Link to="/groupes" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
                        <FiMessageSquare className="mr-3 text-2xl" />
                        Groupes
                    </Link>
                    <Link to="/amis" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
                        <FiUsers className="mr-3 text-2xl" />
                        Amis
                    </Link>
                    <Link to="/profil" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
                        <FiUser className="mr-3 text-2xl" />
                        Profil
                    </Link>
                </nav>

                {/* Bouton de déconnexion */}
                <div className="px-4 py-6">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center text-lg text-red-600 hover:text-red-700">
                        <FiLogOut className="mr-3 text-2xl" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Zone principale */}
            <div className="flex-1 flex flex-col pl-64">
                <header className="bg-white p-4 flex items-center justify-between">
                    {/* Barre de recherche */}
                    <div className="relative flex-grow max-w-3xl ml-8">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-300 text-gray-700"
                        />
                        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-blue-500">
                            <FiSearch className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Profil */}
                    {userProfile && (
                        <img
                            src={userProfile.photoProfil || "./defaultProfile.jpg"}
                            alt="Profile"
                            className="w-14 h-14 rounded-full border-2 border-blue-500 hover:shadow-lg transition duration-300"
                        />
                    )}
                </header>

                {/* Zone centrale */}
                <div className="relative flex-1 p-6 overflow-y-auto">
                    {/* Image en arrière-plan */}
                    <img
                        src="./db4.jpg"
                        alt="Groupes Background"
                        className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                    {/* Superposition pour lisibilité */}
                    <div className="absolute inset-0 z-10"></div>
                    {/* Contenu central */}
                    <div className="relative z-20">
                        {/* Section Voyages */}
                        <section>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-5xl font-extrabold text-white drop-shadow-md">Groupes</h2>


                                <div className="flex flex-col space-y-4">
                                    <button
                                        onClick={() => setShowCreateGroupModal(true)}
                                        className="px-5 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition duration-300"
                                    >
                                        Créer un groupe
                                    </button>

                                    <button
                                        onClick={() => setShowJoinGroupModal(true)}
                                        className="px-5 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition duration-300"
                                    >
                                        Rejoindre un groupe
                                    </button>
                                </div>


                                {showCreateGroupModal && (
                                    <CreateGroup onClose={() => setShowCreateGroupModal(false)} />
                                )}
                                {showJoinGroupModal && (
                                    <JoinGroup onClose={() => setShowJoinGroupModal(false)} />
                                )}

                            </div>
                            {/* Grille de cartes voyages */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {groups.map((group) => (
                                    <div
                                        key={group.id}
                                        onClick={() => navigate(`/group/${group.name}`)} // Navigate to the group page
                                        className="bg-white bg-opacity-90 rounded-xl p-6 transition duration-300 cursor-pointer hover:shadow-lg"
                                    >
                                        <h3 className="text-2xl font-bold text-black mb-4">
                                            {group.name || "Nom indisponible"}
                                        </h3>
                                        <p className="text-lg text-gray-800">
                                            👥 Participants : {group.participants?.length || 0}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Groupes;
