import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, query, collection, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {app} from "../config/firebase-config";

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
                <Link to="/sondages" className="text-lg text-gray-700 hover:text-gray-900">
                  Sondages
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-lg text-gray-700 hover:text-gray-900">
                  Chat
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Profile Section */}
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-3xl p-8">
          <h1 className="text-4xl font-extrabold text-center text-blue-500 mb-8">
            Mon Profil
          </h1>
          {notification && (
            <div
              className={`mb-6 p-4 rounded-lg text-white ${
                notification.type === "success" ? "bg-green-500" : "bg-red-500"
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
  );
};

export default Profile;

