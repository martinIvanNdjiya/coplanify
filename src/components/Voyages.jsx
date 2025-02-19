import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import {
  FiAirplay,
  FiMessageSquare,
  FiGrid,
  FiLogOut,
  FiUser,
  FiUsers,
  FiX,
  FiCalendar
} from "react-icons/fi";
import { app } from "../config/firebase-config";
import FlightSearchForm from "./FlightSearchForm";
import FlightResultCard from "./FlightResultCard";
import { isValid } from "date-fns";

const Voyages = () => {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    flightType: "one-way",
    departureDate: "",
    returnDate: "",
    travelClass: "ECONOMY",
    adults: 1,
  });

  const [results, setResults] = useState([]);
  const auth = getAuth(app);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ origin: [], destination: [] });
  const [cityCodes, setCityCodes] = useState({ origin: {}, destination: {} });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "origin":
      case "destination":
        if (!value) error = "Ce champ est requis";
        else if (!cityCodes[name][value.toLowerCase()]) {
          error = "Ville non reconnue";
        }
        break;
      case "departureDate":
        if (!isValid(new Date(value))) error = "Date invalide";
        break;
      case "returnDate":
        if (
          form.flightType === "round-trip" &&
          new Date(value) <= new Date(form.departureDate)
        ) {
          error = "Doit être après la date de départ";
        }
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleSearch = async () => {
    const isValidForm = Object.keys(form).every((field) => {
      if (field === "returnDate" && form.flightType === "one-way") return true;
      return validateField(field, form[field]);
    });

    if (!isValidForm) return;

    setLoading(true);

    try {
      const originCode = cityCodes.origin[form.origin.toLowerCase()];
      const destinationCode =
        cityCodes.destination[form.destination.toLowerCase()];

      if (!originCode || !destinationCode) {
        setErrors({ general: "Veuillez sélectionner des aéroports valides." });
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        origin: originCode,
        destination: destinationCode,
        departureDate: form.departureDate,
        adults: form.adults,
        travelClass: form.travelClass,
        currency: "CAD",
        ...(form.flightType === "round-trip" && {
          returnDate: form.returnDate,
        }),
      });

      const response = await fetch(`/api/search?${params}`);
      const { data } = await response.json();

      if (!response.ok) {
        throw new Error(data?.errors?.[0]?.detail || "Erreur inconnue");
      }

      console.log('aaa', data?.offers || data || []);
      
      setResults( data);
    } catch (error) {
      setErrors({ general: error.message });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Navbar */}
      <header className="bg-white p-6 border-b border-gray-300">
        <Link to="/" className="text-4xl font-extrabold text-blue-500">
          Coplanify
        </Link>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white flex flex-col border-r border-gray-300 shadow-md">
          <nav className="flex-1 px-4 py-6 space-y-4">
            <Link
              to="/dashboard"
              className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition"
            >
              <FiGrid className="mr-3 text-2xl" />
              Tableau de bord
            </Link>
            <Link
              to="/voyages"
              className="flex items-center text-lg font-medium text-blue-500 font-semibold"
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
              className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition"
            >
              <FiMessageSquare className="mr-3 text-2xl" />
              Groupes
            </Link>
            <Link
              to="/amis"
              className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition"
            >
              <FiUsers className="mr-3 text-2xl" />
              Amis
            </Link>
            <Link
              to="/profil"
              className="flex items-center text-lg font-medium text-gray-700 hover:text-blue-500 transition"
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

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-10 relative">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-90"
            style={{ backgroundImage: "url('./voyages.jpg')" }}
          ></div>
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>

          <div className="relative z-20 flex justify-center flex-1">
            <FlightSearchForm
              onSubmit={handleSearch}
              form={form}
              setForm={setForm}
              errors={errors}
              setErrors={setErrors}
              options={options}
              setOptions={setOptions}
              cityCodes={cityCodes}
              setCityCodes={setCityCodes}
              loading={loading}
            />
          </div>
        </main>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60 backdrop-blur-lg p-6 transition-all duration-300 ease-out">
          <div className="relative bg-white/90 shadow-2xl rounded-3xl p-8 w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden transform scale-95 animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={() => setResults([])}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 transition-all"
            >
              <FiX className="text-3xl" />
            </button>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-6 tracking-tight">
              ✈️ Meilleurs vols disponibles
            </h2>

            {/* Scrollable Results */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((offer, idx) => (
                  <Link
                    key={idx}
                    to={`/voyage/${idx}`}
                    state={{ offer }}
                    className="block transform transition-transform duration-300 hover:scale-105"
                  >
                    <FlightResultCard key={idx} offer={offer} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setResults([])}
                className="px-6 py-3 bg-red-500 text-white text-lg font-semibold rounded-full shadow-md hover:bg-red-600 transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Voyages;
