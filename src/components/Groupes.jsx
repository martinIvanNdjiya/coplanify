import { Link, useNavigate } from "react-router-dom";
import {
  FiAirplay,
  FiUsers,
  FiLogOut,
  FiUser,
  FiMessageSquare,
  FiGrid,
  FiCalendar
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  query,
  collection,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { app } from "../config/firebase-config";
import CreateGroup from "./CreateGroupe";
import JoinGroup from "./JoinGroup";

const Groupes = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(
            collection(db, "users"),
            where("uid", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setUserProfile(userData);
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération du profil utilisateur :",
            error
          );
        }
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [auth, db, navigate]);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      console.log("User is not logged in");
      return;
    }

    const groupsRef = collection(db, "groups");
    const groupsQuery = query(
      groupsRef,
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const groupData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(groupData);
    });

    return () => unsubscribe();
  }, [db, auth.currentUser]);

  const handleLogout = async () => {
    try {
      const userId = userProfile.uid;
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          online: false,
        });
      }

      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="fixed top-0 left-0 h-full w-64 bg-white flex flex-col">
        <header className="bg-white p-6 border-b border-gray-300">
          <Link to="/" className="text-4xl font-extrabold text-blue-500">
            Coplanify
          </Link>
        </header>
        <nav className="flex-1 px-4 py-6 space-y-4">
          <Link
            to="/dashboard"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiGrid className="mr-3 text-2xl" />
            Tableau de bord
          </Link>
          <Link
            to="/voyages"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiAirplay className="mr-3 text-2xl" />
            Voyages
          </Link>
          <Link
            to="/reservations"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiCalendar className="mr-3 text-2xl" />
            Réservations
          </Link>
          <Link
            to="/groupes"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiMessageSquare className="mr-3 text-2xl" />
            Groupes
          </Link>
          <Link
            to="/amis"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiUsers className="mr-3 text-2xl" />
            Amis
          </Link>
          <Link
            to="/profil"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiUser className="mr-3 text-2xl" />
            Profil
          </Link>
        </nav>
        <div className="px-4 py-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center text-lg text-red-600 hover:text-red-700"
          >
            <FiLogOut className="mr-3 text-2xl" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col pl-64">
        <header className="bg-white p-4 flex items-center justify-between">
          <div className="relative flex-grow max-w-3xl ml-8"></div>
          <div className="w-14 h-14"></div>
        </header>

        <div className="relative flex-1 p-6 overflow-y-auto">
          <div
            className="absolute top-0 left-0 w-full min-h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('./groupes-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div className="absolute inset-0 z-10"></div>
          <div className="relative z-20 flex justify-center items-center">
            <div className="relative z-10 w-full max-w-5xl bg-white/95 shadow-xl rounded-3xl p-10 backdrop-blur-lg mt-12 border border-gray-200">
              <h1 className="text-5xl font-extrabold text-center text-blue-500 mb-6">
                Mes Groupes
              </h1>
              <div className="flex justify-center space-x-6 mb-10">
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-md hover:bg-blue-700 transition duration-300"
                >
                  ➕ Créer un groupe
                </button>
                <button
                  onClick={() => setShowJoinGroupModal(true)}
                  className="flex items-center px-8 py-4 bg-gray-500 text-white text-lg font-semibold rounded-xl shadow-md hover:bg-gray-600 transition duration-300"
                >
                  🔗 Rejoindre un groupe
                </button>
              </div>
              {showCreateGroupModal && (
                <CreateGroup onClose={() => setShowCreateGroupModal(false)} />
              )}
              {showJoinGroupModal && (
                <JoinGroup onClose={() => setShowJoinGroupModal(false)} />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => navigate(`/group/${group.id}`)}
                      className="bg-white bg-opacity-90 rounded-xl p-6 shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:scale-105 border border-gray-200"
                    >
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {group.name || "Nom indisponible"}
                      </h3>
                      <p className="text-gray-600 text-lg">
                        👥 {group.participants?.length || 0} participants
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center bg-white/80 rounded-xl shadow-lg p-10 text-center mt-12 max-w-lg">
                    <h3 className="text-2xl font-bold text-gray-700">
                      Aucun groupe trouvé
                    </h3>
                    <p className="text-gray-600 mt-2">
                      Créez un groupe ou rejoignez-en un pour commencer !
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groupes;
