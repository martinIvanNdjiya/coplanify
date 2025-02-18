import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { app } from "../config/firebase-config";
import { FiAirplay, FiUsers, FiLogOut, FiUser, FiMessageSquare, FiGrid } from "react-icons/fi";

const Amis = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [userProfile, setUserProfile] = useState(null);
  const [amis, setAmis] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [emailNouvelAmi, setEmailNouvelAmi] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, "users"), where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setUserProfile(userData);
            fetchAmis(querySnapshot.docs[0].id);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des amis :", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchAmis = async (userId) => {
    try {
      const amisRef = collection(db, "users", userId, "amis");
      const amisSnapshot = await getDocs(amisRef);
      const amisList = await Promise.all(
        amisSnapshot.docs.map(async (doc) => {
          const amiData = doc.data();
          const q = query(collection(db, "users"), where("uid", "==", amiData.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const amiProfile = querySnapshot.docs[0].data();
            return { id: doc.id, ...amiProfile };
          }
          return null;
        })
      );
      setAmis(amisList.filter((ami) => ami !== null));
    } catch (error) {
      console.error("Erreur lors de la récupération des amis :", error);
    }
  };

  const handleAjouterAmi = async () => {
    try {
      if (!emailNouvelAmi) {
        setNotification({ type: "error", message: "Veuillez entrer un email valide." });
        return;
      }

      const q = query(collection(db, "users"), where("email", "==", emailNouvelAmi));
      const querySnapshot = await getDocs(q);

      const q2 = query(collection(db, "users"), where("uid", "==", userProfile.uid));
      const querySnapshot2 = await getDocs(q2);

      if (querySnapshot.empty) {
        setNotification({ type: "error", message: "Utilisateur introuvable." });
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      const amiDoc = querySnapshot.docs[0];
      const amiData = amiDoc.data();
      const currentUserDoc = querySnapshot2.docs[0];
      const currentUserId = currentUserDoc.id;
      const amiId = amiDoc.id;

      // Ajoute l'ami à la sous-collection "amis" de l'utilisateur actuel
      const currentUserAmisRef = doc(db, "users", currentUserId, "amis", amiId);
      await setDoc(currentUserAmisRef, {
        uid: amiData.uid,
        email: amiData.email,
      });

      // Ajoute l'utilisateur actuel à la sous-collection "amis" de l'ami ajouté
      const amiAmisRef = doc(db, "users", amiId, "amis", currentUserId);
      await setDoc(amiAmisRef, {
        uid: userProfile.uid,
        email: userProfile.email,
      });

      setNotification({ type: "success", message: "Ami ajouté avec succès !" });
      setTimeout(() => setNotification(null), 3000);
      setShowPopup(false);
      setEmailNouvelAmi("");
      fetchAmis(currentUserId);
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'ami :", error);
      setNotification({ type: "error", message: "Une erreur s'est produite lors de l'ajout de l'ami." });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSupprimerAmi = async (amiId) => {
    try {
      const q2 = query(collection(db, "users"), where("uid", "==", userProfile.uid));
      const querySnapshot2 = await getDocs(q2);

      if (!querySnapshot2.empty) {
        const currentUserDoc = querySnapshot2.docs[0];
        const currentUserId = currentUserDoc.id;

        // Supprimer l'ami de la sous-collection "amis" de l'utilisateur actuel
        const currentUserAmisRef = doc(db, "users", currentUserId, "amis", amiId);
        await deleteDoc(currentUserAmisRef);

        // Supprimer l'utilisateur actuel de la sous-collection "amis" de l'ami
        const amiAmisRef = doc(db, "users", amiId, "amis", currentUserId);
        await deleteDoc(amiAmisRef);

        setNotification({ type: "success", message: "Ami supprimé avec succès." });
        setTimeout(() => setNotification(null), 3000);
        fetchAmis(currentUserId);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'ami :", error);
      setNotification({ type: "error", message: "Une erreur s'est produite lors de la suppression de l'ami." });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleLogout = async () => {
      try {
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
          <Link to="/" className="text-4xl font-extrabold text-blue-500">
            Coplanify
          </Link>
        </header>

        {/* Navigation */}
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

        {/* Bouton de déconnexion */}
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

      {/* Zone principale */}
      <div className="flex-1 flex flex-col pl-64">
        <header className="bg-white p-4 flex items-center justify-between">
          <div className="relative flex-grow max-w-3xl ml-8"></div>

          {/* Espace réservé pour maintenir la hauteur du navbar */}
          <div className="w-14 h-14"></div>
        </header>

        {/* Zone centrale */}
        <div className="relative flex-1 p-6 overflow-y-auto">
          {/* Image en arrière-plan ajustable */}
          <div
            className="absolute top-0 left-0 w-full min-h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('./amis.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>

          {/* Superposition pour lisibilité */}
          <div className="absolute inset-0 z-10"></div>

          {/* Contenu central */}
          <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16">
            <h1 className="text-5xl font-extrabold text-blue-500 text-center mb-12 drop-shadow-lg ">
              Mes Amis
            </h1>

            {notification && (
              <div
                className={`mb-6 p-4 rounded-lg text-white text-center ${
                  notification.type === "success" ? "bg-green-500" : "bg-red-500"
                } animate-fadeIn`}
              >
                {notification.message}
              </div>
            )}

            {/* Liste des amis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
              {amis.map((ami) => (
                <div
                  key={ami.id}
                  className="bg-white/90 rounded-3xl shadow-xl p-8 flex flex-col items-center space-y-4 relative transform transition-all hover:scale-105 hover:shadow-2xl border border-gray-200"
                >
                  <div className="relative w-24 h-24">
                    <img
                      src={ami.photoProfil || "./user.jpg"}
                      alt="Profil"
                      className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-lg object-cover"
                    />
                    <span
                      className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white ${
                        ami.online ? "bg-green-500 animate-pulse" : "bg-red-500"
                      }`}
                    ></span>
                    {console.log(ami)}
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800">{ami.prenom} {ami.nom}</h3>
                    <p className="text-md text-gray-600">{ami.email}</p>
                  </div>

                  {/* Bouton pour supprimer un ami */}
                  <button
                    onClick={() => handleSupprimerAmi(ami.id)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition transform hover:scale-125 text-2xl"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>

            {/* Bouton Ajouter un Ami */}
            <div className="mt-12 text-center">
              <button
                onClick={() => setShowPopup(true)}
                className="px-8 py-4 bg-blue-500 text-white rounded-full font-semibold shadow-lg hover:bg-blue-600 transition-all transform hover:scale-110 animate-pulse"
              >
                Ajouter un ami
              </button>
            </div>
          </div>
        </div>

        {/* Popup Ajouter un Ami */}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-xl p-8 shadow-xl max-w-md w-full animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Ajouter un nouvel ami</h2>
              <input
                type="email"
                placeholder="Entrez l'email de l'ami"
                value={emailNouvelAmi}
                onChange={(e) => setEmailNouvelAmi(e.target.value)}
                className="w-full px-4 py-3 mb-6 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowPopup(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAjouterAmi}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Amis;

