import { Link, useNavigate } from "react-router-dom";
import { FiAirplay, FiUsers, FiLogOut, FiUser, FiSearch, FiMessageSquare } from "react-icons/fi";
import { useEffect, useState } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, query, collection, where, getDocs, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { app } from "../config/firebase-config";
import CreateGroup from "./CreateGroupe";

const Dashboard = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [connectedFriends, setConnectedFriends] = useState([]);
  const [amis, setAmis] = useState([]);
  const [sondages, setSondages] = useState([]);

  const convertTimestampToDate = (timestamp) => {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    return "Indisponible";
  };

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
    const unsubscribe = onSnapshot(collection(db, "groups"), (snapshot) => {
      const groupData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter groups where the current user is either the creator or a participant
      const filteredGroups = groupData.filter(group => 
        group.createur === userProfile.uid || group.participants.includes(userProfile.uid)
      );

      // Sort groups by createdAt field in descending order and take the 3 most recent
      const sortedGroups = filteredGroups.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds).slice(0, 3);

      console.log("Filtered and sorted groups:", sortedGroups);
      setGroups(sortedGroups);
    });

    return () => unsubscribe();
  }, [db, userProfile]);

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sondages"), (snapshot) => {
      const sondageData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter sondages where the current user is the creator
      const filteredSondages = sondageData.filter(sondage => 
        sondage.creator === userProfile.uid
      );

      // Sort sondages by date field in descending order and take the 3 most recent
      const sortedSondages = filteredSondages.sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 3);

      console.log("Filtered and sorted sondages:", sortedSondages);
      setSondages(sortedSondages);
    });

    return () => unsubscribe();
  }, [db, userProfile]);

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
            alt="Dashboard Background"
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
          {/* Superposition pour lisibilité */}
          <div className="absolute inset-0 z-10"></div>
          {/* Contenu central */}
          <div className="relative z-20">
            {/* Section Voyages */}
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-5xl font-extrabold text-white drop-shadow-md">Voyages en cours</h2>


                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition duration-300"
                >
                  Créer un groupe
                </button>

                {showCreateGroupModal && (
                  <CreateGroup onClose={() => setShowCreateGroupModal(false)} />
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
            
            {/* Section Sondages */}
            <section className="mt-12">
              <h2 className="text-5xl font-extrabold text-white drop-shadow-md mb-6">Sondages récents</h2>
              {/* Grille de cartes sondages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sondages.map((sondage) => (
                  <div
                    key={sondage.id}
                    onClick={() => navigate(`/sondages/${sondage.id}`)} // Navigate to the sondage page
                    className="bg-white bg-opacity-70 rounded-xl p-6 transition duration-300 cursor-pointer hover:shadow-lg"
                  >
                    <h3 className="text-2xl font-bold text-black mb-4">{sondage.question || "Titre indisponible"}</h3>
                    <p className="text-lg text-gray-800">📊 Expiration : {convertTimestampToDate(sondage.expiration)}</p>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Section Amis connectés */}
            <section className="mt-12">
              <h2 className="text-5xl font-extrabold text-white drop-shadow-md mb-6">
                Amis connectés
              </h2>

              {connectedFriends.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {connectedFriends.map((friend) => (
                    <div
                      key={friend.uid}
                      className="bg-white/90 rounded-2xl shadow-lg p-6 flex items-center space-x-6 relative transform transition-all hover:scale-105 hover:shadow-2xl border border-gray-200"
                    >
                      {/* Image de Profil */}
                      <div className="relative">
                        <img
                          src={friend.photoProfil || "./defaultProfile.jpg"}
                          alt="Profil"
                          className="w-20 h-20 rounded-full border-4 border-blue-500 shadow-md"
                        />
                      </div>

                      {/* Infos de l'ami */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {friend.prenom} {friend.nom}
                        </h3>
                        <p className="text-md text-gray-600">🟢 En ligne</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-white/80 rounded-xl shadow-lg p-10 text-center mt-12 max-w-lg ">
                  <h3 className="text-2xl font-bold text-gray-700">Aucun ami connecté</h3>
                  <p className="text-gray-600 mt-2">
                    Invitez vos amis pour voir leur statut en ligne ici !
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
