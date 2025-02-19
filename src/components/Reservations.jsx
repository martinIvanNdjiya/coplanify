import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { app } from "../config/firebase-config";
import { Link, useNavigate } from "react-router-dom";
import { FiGrid, FiAirplay, FiUsers, FiUser, FiMessageSquare, FiLogOut, FiCalendar, FiX } from "react-icons/fi";

const Reservations = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const fetchReservations = async () => {
          const q = query(collection(db, "reservations"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const reservationsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setReservations(reservationsList);
        };

        fetchReservations();
      } else {
        navigate("/"); // Redirect to home if user is not logged in
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, [auth, db, navigate]);

  const handleDelete = async (reservationId) => {
    try {
      await deleteDoc(doc(db, "reservations", reservationId));
      setReservations((prevReservations) => prevReservations.filter((reservation) => reservation.id !== reservationId));
    } catch (error) {
      console.error("Erreur lors de la suppression de la réservation :", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <div className="flex h-screen">
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
          <Link to="/dashboard" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
            <FiGrid className="mr-3 text-2xl" /> Tableau de bord
          </Link>
          <Link to="/voyages" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
            <FiAirplay className="mr-3 text-2xl" /> Voyages
          </Link>
          <Link to="/reservations" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
            <FiCalendar className="mr-3 text-2xl" /> Réservations
          </Link>
          <Link to="/groupes" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
            <FiMessageSquare className="mr-3 text-2xl" /> Groupes
          </Link>
          <Link to="/amis" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
            <FiUsers className="mr-3 text-2xl" /> Amis
          </Link>
          <Link to="/profil" className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300">
            <FiUser className="mr-3 text-2xl" /> Profil
          </Link>
        </nav>

        {/* Bouton de déconnexion */}
        <div className="px-4 py-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center text-lg text-red-600 hover:text-red-700">
            <FiLogOut className="mr-3 text-2xl" /> Déconnexion
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
        <div className="relative flex-1 p-6">
          {/* Image en arrière-plan ajustable */}
          <div
            className="absolute top-0 left-0 w-full min-h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('./reservations.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>

          {/* Superposition pour lisibilité */}
          <div className="absolute inset-0  z-10"></div>

          {/* Contenu principal */}
          <div className="relative z-20 flex justify-center items-center">
            <div className="relative z-10 w-full max-w-6xl bg-white/90 shadow-2xl rounded-3xl p-10 backdrop-blur-md mt-12">
              <h1 className="text-5xl font-extrabold text-center text-blue-500 mb-6">Mes Réservations</h1>
              <div className="flex-1 pr-2">
                {reservations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reservations.map((reservation) => (
                      <div key={reservation.id} className="bg-white shadow-lg rounded-xl p-6 hover:scale-105 transition-transform relative">
                        <button onClick={() => handleDelete(reservation.id)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                          <FiX className="text-2xl" />
                        </button>
                        <div className="absolute top-4 right-12 bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-lg">
                          Confirmé
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Réservation #{reservation.id}</h2>
                        <p className="text-gray-700">
                          <span className="text-blue-500 font-semibold">Prix :</span> {reservation.currency} {reservation.price}
                        </p>
                        <p className="text-gray-700">
                          <span className="text-blue-500 font-semibold">Départ :</span> {reservation.departure}
                        </p>
                        <p className="text-gray-700">
                          <span className="text-blue-500 font-semibold">Arrivée :</span> {reservation.arrival}
                        </p>
                        <p className="text-gray-700">
                          <span className="text-blue-500 font-semibold">Durée :</span> {reservation.duration}
                        </p>
                        <p className="text-gray-700">
                          <span className="text-blue-500 font-semibold">Réservé le :</span> {new Date(reservation.bookingDate.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-700 text-lg font-medium">
                    Aucune réservation trouvée.
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

export default Reservations;
