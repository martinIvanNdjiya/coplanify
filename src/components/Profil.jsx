import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, query, collection, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiAirplay, FiUsers, FiLogOut, FiUser, FiMessageSquare, FiGrid } from "react-icons/fi";
import { app } from "../config/firebase-config";

const Profile = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [notification, setNotification] = useState(null);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, "users"), where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setUserProfile(userData);
            setPrenom(userData.prenom || "");
            setNom(userData.nom || "");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du profil utilisateur :", error);
        }
      } else {
        navigate("/"); // Redirige vers la page d'accueil si l'utilisateur n'est pas connecté
      }
    });

    return () => unsubscribe(); // Nettoie le listener
  }, [auth, db, navigate]);

  const handleProfileUpdate = async () => {
    try {
      if (auth.currentUser) {
        const q = query(collection(db, "users"), where("uid", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userRef = doc(db, "users", userDoc.id);
          await updateDoc(userRef, { prenom, nom });
          setNotification({ type: "success", message: "Profil mis à jour avec succès !" });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil :", error);
      setNotification({ type: "error", message: "Erreur lors de la mise à jour du profil." });
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file && auth.currentUser) {
      try {
        const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);

        const q = query(collection(db, "users"), where("uid", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userRef = doc(db, "users", userDoc.id);
          await updateDoc(userRef, { photoProfil: photoURL });
          setUserProfile((prevProfile) => ({ ...prevProfile, photoProfil: photoURL }));
          setNotification({ type: "success", message: "Photo de profil mise à jour avec succès !" });
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la photo de profil :", error);
        setNotification({ type: "error", message: "Erreur lors de la mise à jour de la photo de profil." });
      }
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
              backgroundImage: "url('./profil.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>

          {/* Superposition pour lisibilité */}
          <div className="absolute inset-0 z-10"></div>
          {/* Contenu central */}
          <div className="relative z-20 flex justify-center items-center">
            <div className="relative z-10 w-full max-w-4xl bg-white/90 shadow-2xl rounded-3xl p-10 backdrop-blur-md mt-12">
              <h1 className="text-4xl font-extrabold text-center text-blue-500 mb-8">
                Mon Profil
              </h1>

              {notification && (
                <div
                  className={`mb-6 p-4 rounded-lg text-white text-center ${
                    notification.type === "success"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                >
                  {notification.message}
                </div>
              )}

              {userProfile ? (
                <div className="flex flex-col lg:flex-row items-center lg:items-start lg:space-x-8">
                  {/* Section Photo de profil */}
                  <div className="flex flex-col items-center space-y-4">
                    <img
                      src={userProfile.photoProfil || "./defaultProfile.jpg"}
                      alt="Photo de profil"
                      className="w-48 h-48 rounded-full shadow-lg object-cover border-4 border-blue-500"
                    />
                    <label className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 cursor-pointer">
                      Changer la photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Section Informations */}
                  <div className="flex-1 mt-8 lg:mt-0">
                    <div className="space-y-6">
                      {/* Champ Prénom */}
                      <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">
                          Prénom
                        </label>
                        <input
                          type="text"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {/* Champ Nom */}
                      <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">
                          Nom
                        </label>
                        <input
                          type="text"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {/* Champ Email */}
                      <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={userProfile.email}
                          readOnly
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100"
                        />
                      </div>
                    </div>

                    {/* Bouton de mise à jour */}
                    <div className="mt-8 text-right">
                      <button
                        onClick={handleProfileUpdate}
                        className="px-8 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
                      >
                        Mettre à jour
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-600">Chargement...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

