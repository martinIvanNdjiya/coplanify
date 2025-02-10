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
        <div className="min-h-screen bg-gray-100">
            {/* Navbar */}
            <nav className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <Link to="/" className="text-4xl font-extrabold text-blue-500">Coplanify</Link>
                    <div className="flex items-center space-x-8">
                        <ul className="flex space-x-6">
                            <li>
                                <Link to="/dashboard" className="text-lg text-gray-700 hover:text-gray-900">
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link to="/voyages" className="text-lg text-gray-700 hover:text-gray-900">
                                    Voyages
                                </Link>
                            </li>
                            <li>
                                <Link to="/groupes" className="text-lg text-blue-500 font-semibold">
                                    Groupes
                                </Link>
                            </li>
                            <li>
                                <Link to="/profil" className="text-lg text-gray-700 hover:text-gray-900">
                                    Profil
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Main Group Section */}
            <div className="relative min-h-screen flex flex-col items-center justify-center py-12 px-4"
                style={{ backgroundImage: "url('./groupes-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
                
                <div className="relative z-10 w-full max-w-4xl bg-white/90 shadow-2xl rounded-3xl p-10 backdrop-blur-md mt-12">
                    <h1 className="text-4xl font-extrabold text-center text-blue-500 mb-8">
                        Mes Groupes
                    </h1>

                    {/* Buttons */}
                    <div className="flex justify-center space-x-6 mb-8">
                        <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className="px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
                        >
                            Créer un groupe
                        </button>

                        <button
                            onClick={() => setShowJoinGroupModal(true)}
                            className="px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
                        >
                            Rejoindre un groupe
                        </button>
                    </div>

                    {showCreateGroupModal && <CreateGroup onClose={() => setShowCreateGroupModal(false)} />}
                    {showJoinGroupModal && <JoinGroup onClose={() => setShowJoinGroupModal(false)} />}

                    {/* Groups Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groups.length > 0 ? (
                            groups.map((group) => (
                                <div
                                    key={group.id}
                                    onClick={() => navigate(`/group/${group.name}`)}
                                    className="bg-white bg-opacity-90 rounded-xl p-6 shadow-md hover:shadow-lg cursor-pointer transition duration-300"
                                >
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{group.name || "Nom indisponible"}</h3>
                                    <p className="text-gray-600 text-lg">👥 {group.participants?.length || 0} participants</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600 text-center text-lg">Aucun groupe trouvé.</p>
                        )}
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="absolute top-6 right-6 flex items-center text-lg text-red-600 hover:text-red-700 transition"
                >
                    <FiLogOut className="mr-3 text-2xl" />
                    Déconnexion
                </button>
            </div>
        </div>
    );
};


export default Groupes;
