import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {app} from "../config/firebase-config";

const Register = () => {
  const auth = getAuth(app);
  const storage = getStorage(app);
  const db = getFirestore(app);
  const navigate = useNavigate();

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Création de l'utilisateur avec email et mot de passe
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Téléchargement de la photo de profil dans Firebase Storage
      let photoURL = "";
      if (photo) {
        const photoRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(photoRef, photo);
        photoURL = await getDownloadURL(photoRef);
      }

      // Sauvegarde des informations utilisateur dans Firestore
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        prenom,
        nom,
        email,
        photoProfil: photoURL,
      });

      console.log("Utilisateur enregistré avec succès !");
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      alert("Échec de l'inscription. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row-reverse items-center bg-gray-100">
      {/* Section droite avec l'image */}
      <div className="lg:w-1/2 w-full h-64 lg:h-screen relative overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          src="./login.mp4" // Remplace par ton chemin vidéo
          autoPlay
          loop
          muted
          playsInline
        ></video>
        <div className="absolute inset-0 bg-blue-500 bg-opacity-40 flex items-center justify-center">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white drop-shadow-lg">
            Coplanify
          </h1>
        </div>
      </div>

      {/* Section gauche avec le formulaire */}
      <div className="lg:w-1/2 w-full flex items-center justify-center p-8">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-6">
            Créez un compte
          </h2>
          <p className="text-lg text-gray-600 text-center mb-8">
            Rejoignez Coplanify et commencez à planifier vos voyages dès
            aujourd&apos;hui !
          </p>
          <form className="space-y-6" onSubmit={handleRegister}>
            {/* Prénom */}
            <div>
              <label
                htmlFor="prenom"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Prénom
              </label>
              <input
                type="text"
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre prénom"
                required
              />
            </div>

            {/* Nom */}
            <div>
              <label
                htmlFor="nom"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Nom
              </label>
              <input
                type="text"
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre nom"
                required
              />
            </div>

            {/* Adresse e-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Adresse e-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre e-mail"
                required
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre mot de passe"
                required
              />
            </div>

            {/* Photo de profil */}
            <div>
              <label
                htmlFor="photo"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Photo de profil
              </label>
              <input
                type="file"
                id="photo"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Bouton d'inscription */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-600 transition duration-300"
            >
              S&apos;inscrire
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Vous avez déjà un compte ?{" "}
              <a
                href="/login"
                className="text-blue-500 font-semibold hover:underline"
              >
                Connectez-vous
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
