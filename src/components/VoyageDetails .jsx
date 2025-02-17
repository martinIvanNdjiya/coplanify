import React, { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Chart } from "chart.js/auto";
import { FiCalendar } from "react-icons/fi";
import { FaShare } from "react-icons/fa";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { addDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase-config";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const VoyageDetails = () => {
  const location = useLocation();
  const { offer: offre } = location.state || {};

  const chartRef = useRef(null);


  const [coordsDepart, setCoordsDepart] = useState(null);
  const [coordsArrivee, setCoordsArrivee] = useState(null);


  const [totalVol, setTotalVol] = useState(0);   
  const [totalEscale, setTotalEscale] = useState(0);
  const dureeTotale = totalVol + totalEscale;

  const [isModalOpenGroup, setIsModalOpenGroup] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [shareMessage, setShareMessage] = useState("");

 
// Convertit une durée ISO (ex: "PT2H30M") en heures (ex: 2.5)

  function calculDureeHeures(dureeIso) {
    if (!dureeIso) return 0;
    const duree = dureeIso.replace("PT", "");
    const heures = duree.match(/(\d+)H/);
    const minutes = duree.match(/(\d+)M/);
    const h = heures ? parseInt(heures[1], 10) : 0;
    const m = minutes ? parseInt(minutes[1], 10) : 0;
    return h + m / 60;
  }

  /**
   * Calcule le temps d'escale (en heures) entre deux segments.
   */
  function calculEscale(seg1, seg2) {
    if (!seg1 || !seg2) return 0;
    const arrivee = new Date(seg1.arrival.at).getTime();
    const depart = new Date(seg2.departure.at).getTime();
    const diffMs = depart - arrivee;
    if (diffMs < 0) return 0; 
    return diffMs / (1000 * 60 * 60); 
  }

  /**
   * Récupère les coordonnées (latitude/longitude) d'un aéroport via l'API
   */
  async function fetchCoordonneesAeroport(iata) {
    const reponse = await fetch(`http://localhost:3000/api/airport?iataCode=${iata}`);
    if (!reponse.ok) {
      throw new Error(`Impossible de récupérer les coordonnées pour ${iata}`);
    }
    return reponse.json();
  }

  const shareTripInGroupChat = async () => {
    if (!selectedGroupId) {
      alert("Veuillez sélectionner un groupe.");
      return;
    }
    try {
      const user = auth.currentUser;
      const itinerary = offre.itineraries[0];
      const firstSegment = itinerary.segments[0];
      const lastSegment = itinerary.segments[itinerary.segments.length - 1];
      const messageContent = `Price: ${offre.price.currency} ${offre.price.total}, Duration: ${itinerary.duration},
Départ: ${firstSegment.departure.iataCode}, Arrivée: ${lastSegment.arrival.iataCode}.
Message: ${shareMessage}`;
      const message = {
        message: messageContent,
        date: new Date(),
        idUtilisateur: user.uid,
      };
      await addDoc(collection(db, "groups", selectedGroupId, "messages"), message);
      setShareMessage("");
      setIsModalOpenGroup(false);
      alert("Itinéraire partagé avec succès !");
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      alert("Erreur lors du partage. Veuillez réessayer.");
    }
  };


  useEffect(() => {
    if (!offre) return;

    // On part du premier itinéraire
    const itineraires = offre.itineraries || [];
    if (itineraires.length === 0) return;

    const segments = itineraires[0].segments || [];
    if (segments.length === 0) return;

    // Premier et dernier segment
    const premierSegment = segments[0];
    const dernierSegment = segments[segments.length - 1];

    const iataDepart = premierSegment.departure.iataCode;
    const iataArrivee = dernierSegment.arrival.iataCode;

    // Fetch coordonnées
    fetchCoordonneesAeroport(iataDepart)
      .then((data) => {
        setCoordsDepart({ iata: iataDepart, lat: data.latitude, lon: data.longitude });
      })
      .catch((err) => console.error("Erreur coords départ:", err));
    fetchCoordonneesAeroport(iataArrivee)
      .then((data) => {
        setCoordsArrivee({ iata: iataArrivee, lat: data.latitude, lon: data.longitude });
      })
      .catch((err) => console.error("Erreur coords arrivée:", err));

    // Préparation du chart
    const dureesVol = segments.map((seg) => calculDureeHeures(seg.duration));
    const dureesEscale = segments.map((seg, idx) => {
      const segmentActuel = seg;
      const segmentSuivant = segments[idx + 1];
      return calculEscale(segmentActuel, segmentSuivant);
    });

    const sommeVol = dureesVol.reduce((acc, val) => acc + val, 0);
    const sommeEscale = dureesEscale.reduce((acc, val) => acc + val, 0);
    setTotalVol(sommeVol);
    setTotalEscale(sommeEscale);

    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      const monChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: segments.map((_, i) => `Segment ${i + 1}`),
          datasets: [
            {
              label: "Vol (h)",
              data: dureesVol,
              backgroundColor: "#3B82F6",
            },
            {
              label: "Escale (h)",
              data: dureesEscale,
              backgroundColor: "#f97316",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "top" } },
          scales: {
            x: { stacked: true, ticks: { color: "#4B5563" } },
            y: {
              stacked: true,
              ticks: { color: "#4B5563" },
              title: { display: true, text: "Heures", color: "#374151" },
            },
          },
        },
      });
      return () => monChart.destroy();
    }
  }, [offre]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, "groups"),
          where("participants", "array-contains", user.uid)
        );
        const unsubscribeGroups = onSnapshot(q, (snapshot) => {
          const updatedGroups = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setGroups(updatedGroups);
          if (updatedGroups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(updatedGroups[0].id);
          }
        });
        return () => unsubscribeGroups();
      }
    });
    return () => unsubscribeAuth();
  }, []);
  

  if (!offre) {
    return (
      <div className="p-8 text-center text-xl font-semibold">
        Aucune donnée de vol disponible
      </div>
    );
  }

  // Centre de la carte (utilise coordsDepart si disponible)
  const centreCarte = coordsDepart ? [coordsDepart.lat, coordsDepart.lon] : [48.8566, 2.3522];

 
  const variantsConteneur = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, when: "beforeChildren", staggerChildren: 0.2 },
    },
  };
  const variantsItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-4"
      variants={variantsConteneur}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header: Back & Share buttons */}
        <motion.div className="flex gap-4 mb-4" variants={variantsItem}>
          <Link
            to="/voyages"
            className="inline-flex items-center bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
          >
            ← Retour aux résultats
          </Link>
          <button
            onClick={() => setIsModalOpenGroup(true)}
            className="inline-flex items-center bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition-colors"
          >
            <FaShare className="mr-2" />
            Partager
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Itinerary details */}
          <motion.div className="space-y-6" variants={variantsItem}>
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Itinéraire
              </h2>
              {offre.itineraries.map((itinerary, idx) => (
                <div key={idx} className="space-y-4">
                  {itinerary.segments.map((segment, sIdx) => (
                    <div
                      key={sIdx}
                      className="border-l-4 border-blue-500 pl-4 py-3"
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <FiCalendar className="text-blue-500" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">
                            {segment.departure.iataCode} → {segment.arrival.iataCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(segment.departure.at).toLocaleDateString()} -{" "}
                            {new Date(segment.arrival.at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                          <p className="text-gray-500">Départ</p>
                          <p>{new Date(segment.departure.at).toLocaleTimeString()}</p>
                          <p className="font-medium uppercase">
                            {segment.departure.iataCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Arrivée</p>
                          <p>{new Date(segment.arrival.at).toLocaleTimeString()}</p>
                          <p className="font-medium uppercase">
                            {segment.arrival.iataCode}
                          </p>
                        </div>
                      </div>
                      {sIdx !== itinerary.segments.length - 1 && (
                        <div className="my-4 border-t border-dashed border-gray-200"></div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right column: Leaflet Map */}
          <motion.div className="bg-white rounded-2xl shadow-md p-6 h-[600px]" variants={variantsItem}>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Carte</h2>
            {(!coordsDepart && !coordsArrivee) && (
              <div className="text-center">Chargement de la carte...</div>
            )}
            {(coordsDepart || coordsArrivee) && (
              <MapContainer
                center={centreCarte}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                {coordsDepart && (
                  <Marker position={[coordsDepart.lat, coordsDepart.lon]}>
                    <Popup>{coordsDepart.iata}</Popup>
                  </Marker>
                )}
                {coordsArrivee && (
                  <Marker position={[coordsArrivee.lat, coordsArrivee.lon]}>
                    <Popup>{coordsArrivee.iata}</Popup>
                  </Marker>
                )}
              </MapContainer>
            )}
          </motion.div>
        </div>

        {/* Flight Analysis Chart */}
        <motion.div className="bg-white rounded-2xl shadow-md p-6 mt-8" variants={variantsItem}>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Analyse du vol</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 text-gray-600">
            <div className="flex-1">
              <p>
                <strong>Durée totale de vol :</strong>{" "}
                {totalVol.toFixed(1)} heures
              </p>
            </div>
            <div className="flex-1">
              <p>
                <strong>Temps total d'escale :</strong>{" "}
                {totalEscale.toFixed(1)} heures
              </p>
            </div>
            <div className="flex-1">
              <p>
                <strong>Durée globale du voyage :</strong>{" "}
                {dureeTotale.toFixed(1)} heures
              </p>
            </div>
          </div>
          <canvas ref={chartRef} className="w-full h-64" />
        </motion.div>

        {/* Modal for sharing in group chat */}
        {isModalOpenGroup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Partager l'itinéraire</h3>
                <button onClick={() => setIsModalOpenGroup(false)} className="text-red-500 text-2xl">
                  &times;
                </button>
              </div>
              <label className="block mb-2">Sélectionnez un groupe :</label>
              <select
                className="w-full p-2 border rounded-lg mb-4"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} - {g.description}
                  </option>
                ))}
              </select>
              <label className="block mb-2">Message :</label>
              <textarea
                placeholder="Tapez votre message..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="w-full p-2 border rounded-lg mb-4"
              />
              <button
                onClick={shareTripInGroupChat}
                className="w-full bg-blue-500 text-white py-2 rounded-lg"
              >
                Partager
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VoyageDetails;
