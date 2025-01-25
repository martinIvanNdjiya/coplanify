import { Link, useNavigate } from "react-router-dom";
import { FiAirplay, FiUsers, FiMessageSquare, FiLogOut, FiUser, FiSettings, FiSearch } from "react-icons/fi";
import { useEffect, useState } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, query, collection, where, getDocs } from "firebase/firestore";
import app from "../config/firebase-config";

const Dashboard = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, "users"), where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setUserProfile(userData);
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
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
          <Link to="/sondages" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
            <FiSettings className="mr-3 text-2xl" />
            Sondages
          </Link>
          <Link to="/chat" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
            <FiMessageSquare className="mr-3 text-2xl" />
            Chat
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
                <button className="px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition duration-300">
                  Créer un groupe
                </button>
              </div>
              {/* Grille de cartes voyages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Exemple de carte voyage */}
                <div className="bg-white bg-opacity-70 rounded-xl p-6 transition duration-300">
                  <h3 className="text-2xl font-bold text-black mb-4">Vacances à Bali</h3>
                  <p className="text-lg text-gray-800 mb-2">📅 Dates : 20-30 Mars 2025</p>
                  <p className="text-lg text-gray-800">👥 Participants : 5</p>
                </div>
                {/* Ajoute plus de cartes ici */}
              </div>
            </section>
                    {/* Section Sondages */}
                    <section className="mt-12">
                <h2 className="text-5xl font-extrabold text-white drop-shadow-md mb-6">Sondages récents</h2>
                {/* Grille de cartes sondages */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="bg-white bg-opacity-70 rounded-xl p-6 transition duration-300">
                    <h3 className="text-2xl font-bold text-black mb-4">Destination préférée ?</h3>
                    <p className="text-lg text-gray-800">📊 Statut : Ouvert</p>
                  </div>
                </div>
              </section>
              {/* Section Amis connectés */}
              <section className="mt-12">
                <h2 className="text-5xl font-extrabold text-white drop-shadow-md mb-6">Amis connectés</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {/* Exemple d'ami connecté */}
                  <div className="flex items-center bg-white bg-opacity-70 rounded-lg p-4 shadow-md hover:shadow-lg transition duration-300">
                    <img
                      src="./friend1.jpg" // Remplace par l'image de profil
                      alt="Profil"
                      className="w-12 h-12 rounded-full border-2 border-blue-500 mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Alice Dupont</h3>
                      <p className="text-sm text-gray-600">🟢 En ligne</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white bg-opacity-70 rounded-lg p-4 shadow-md hover:shadow-lg transition duration-300">
                    <img
                      src="./friend2.jpg" // Remplace par l'image de profil
                      alt="Profil"
                      className="w-12 h-12 rounded-full border-2 border-blue-500 mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Jean Martin</h3>
                      <p className="text-sm text-gray-600">🟢 En ligne</p>
                    </div>
                  </div>
                  {/* Ajoute plus de cartes d'amis connectés ici */}
                </div>
              </section>
            </div>
          </div>
        </div>
        </div>
  );
}
export default Dashboard;
