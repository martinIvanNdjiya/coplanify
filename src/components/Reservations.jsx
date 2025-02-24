import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc 
} from "firebase/firestore";
import { app } from "../config/firebase-config";
import { Link, useNavigate } from "react-router-dom";
import { FiGrid, FiAirplay, FiUsers, FiUser, FiMessageSquare, FiLogOut, FiCalendar, FiX } from "react-icons/fi";

const Reservations = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  // Mapping des groupId vers leur nom
  const [groups, setGroups] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const fetchReservations = async () => {
          const q = query(collection(db, "reservations"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const reservationsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setReservations(reservationsList);
        };

        fetchReservations();
      } else {
        navigate("/"); // Redirection si non connecté
      }
    });

    return () => unsubscribe();
  }, [auth, db, navigate]);

  // Pour chaque réservation, récupère le nom du groupe si ce n'est pas déjà en cache
  useEffect(() => {
    const fetchGroupNames = async () => {
      const newGroups = { ...groups };
      // Récupère tous les groupId uniques
      const groupIds = new Set(reservations.map((r) => r.groupId));
      for (const groupId of groupIds) {
        if (!newGroups[groupId]) { // Vérifie dans newGroups, pas dans groups directement
          const groupRef = doc(db, "groups", groupId);
          const groupSnap = await getDoc(groupRef);
          if (groupSnap.exists()) {
            newGroups[groupId] = groupSnap.data().name || groupId;
          } else {
            newGroups[groupId] = groupId;
          }
        }
      }
      setGroups(newGroups);
    };
  
    if (reservations.length > 0) {
      fetchGroupNames();
    }
    // On ne met que 'reservations' et 'db' dans les dépendances
  }, [reservations, db]);

  const handleReservationClick = (reservation) => {
    navigate(`/group/${reservation.groupId}?tab=reservations`);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  const calculDureeHeures = (dureeIso) => {
    if (!dureeIso) return 0;
    return dureeIso.replace("PT", "");
  };

  return (
    <div className="flex h-screen">
      {/* Barre latérale */}
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
            <FiGrid className="mr-3 text-2xl" /> Tableau de bord
          </Link>
          <Link
            to="/voyages"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiAirplay className="mr-3 text-2xl" /> Voyages
          </Link>
          <Link
            to="/reservations"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiCalendar className="mr-3 text-2xl" /> Réservations
          </Link>
          <Link
            to="/groupes"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiMessageSquare className="mr-3 text-2xl" /> Groupes
          </Link>
          <Link
            to="/amis"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiUsers className="mr-3 text-2xl" /> Amis
          </Link>
          <Link
            to="/profil"
            className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition duration-300"
          >
            <FiUser className="mr-3 text-2xl" /> Profil
          </Link>
        </nav>
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
          <div className="w-14 h-14"></div>
        </header>

        <div className="relative flex-1 p-6">
          {/* Image d'arrière-plan */}
          <div
            className="absolute top-0 left-0 w-full min-h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('./reservations.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div className="absolute inset-0 z-10"></div>

          <div className="relative z-20 flex justify-center items-center">
            <div className="relative z-10 w-full max-w-6xl bg-white/90 shadow-2xl rounded-3xl p-10 backdrop-blur-md mt-12">
              <h1 className="text-5xl font-extrabold text-center text-blue-500 mb-6">Mes Réservations</h1>
              <div className="flex-1 pr-2">
                {reservations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reservations.map((reservation) => {
                      const myVote = reservation.items?.find((item) => item.userId === currentUser?.uid)?.status || "pending";
                      return (
                        <div
                          key={reservation.id}
                          onClick={() => handleReservationClick(reservation)}
                          className="bg-white shadow-lg rounded-xl p-6 hover:scale-105 transition-transform relative cursor-pointer"
                        >
                          {/* Indication de statut */}
                          <div className="absolute top-4 right-12 bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-lg">
                            {reservation.status ? reservation.status : "Confirmé"}
                          </div>
                          <p className="text-gray-700">
                            <span className="text-blue-500 font-semibold">Groupe :</span>{" "}
                            {groups[reservation.groupId] || reservation.groupId}
                          </p>
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
                            <span className="text-blue-500 font-semibold">Durée :</span> {calculDureeHeures(reservation.duration)}
                          </p>
                          <p className="text-gray-700">
                            <span className="text-blue-500 font-semibold">Réservé le :</span>{" "}
                            {new Date(reservation.bookingDate.seconds * 1000).toLocaleDateString()}
                          </p>
                          <p className="text-gray-700 mt-2">
                            <span className="text-blue-500 font-semibold">Mon vote :</span> {myVote}
                          </p>
                        </div>
                      );
                    })}
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
