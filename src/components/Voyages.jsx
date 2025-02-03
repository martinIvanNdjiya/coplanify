import { useState, useEffect,  } from 'react';
import { format, isValid } from 'date-fns';
import { FiSearch, FiUsers, FiClock, FiXCircle } from 'react-icons/fi';
import {FaPaperPlane, FaShare} from "react-icons/fa";
import {Link, useNavigate} from "react-router-dom";
import {addDoc, collection, doc, getDocs, getFirestore, onSnapshot, query, updateDoc, where} from "firebase/firestore";
import {app, db, auth} from "../config/firebase-config.js";
import {getAuth, signOut} from "firebase/auth";

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const FlightResultCard = ({offer, currency}) => {
    const {price, itineraries, oneWay} = offer;
    const [isModalOpenGroup, setIsModalOpenGroup] = useState(false); // Comment modal
    const [groups, setGroups] = useState([]);
    const user = auth.currentUser;
    const [newMessage, setMessage] = useState("");

    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(db, "groups"), where("createur", "==", user.uid)),
            (snapshot) => {
                const updatedGroups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setGroups(updatedGroups);
            },
            (error) => {
                console.error("Error fetching groups: ", error);
            }
        );

        // Cleanup the listener when the component is unmounted
        return () => unsubscribe();
    }, [user.uid]);  // Adding user.uid as a dependency, so it'll update when user changes



    const shareTripInGroupChat = async (groupId) => {
        const user = auth.currentUser;
        const message = {
            message: newMessage + ": " + offer,
            sentAt: new Date(),
            senderId: user.uid,
        };

        await addDoc(collection(db, "groups", groupId, "messages"), message);
        setMessage("");
        setIsModalOpenGroup(false);
    };


    return (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{oneWay ? "Aller Simple" : "Aller-Retour"}</h3>
                <div className="flex items-center">
                    <span className="text-gray-500 text-lg mr-2">Prix: </span>
                    <span className="text-xl font-semibold">{price.currency} {price.total}</span>
                </div>
            </div>

            {/* Itinerary Information */}
            <div className="space-y-4">
                {itineraries.map((itinerary, idx) => (
                    <div key={idx} className="border-t border-gray-200 pt-4">
                        <div className="text-sm text-gray-500 mb-2">
                            <FiClock className="inline mr-1"/>
                            Durée: {itinerary.duration}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">Segments:</div>

                        <ul className="space-y-2">
                            {itinerary.segments.map((segment, segmentIdx) => (
                                <li key={segmentIdx}
                                    className="flex flex-col sm:flex-row justify-between sm:items-center py-2">
                                    <div className="flex-1">
                                        <p>
                                            <strong>Départ:</strong> {segment.departure.iataCode} à {format(new Date(segment.departure.at), 'dd/MM/yyyy HH:mm')}
                                        </p>
                                        <p>
                                            <strong>Arrivée:</strong> {segment.arrival.iataCode} à {format(new Date(segment.arrival.at), 'dd/MM/yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <div className="sm:ml-4 mt-2 sm:mt-0 flex items-center text-gray-500">
                                        <FiUsers className="mr-2"/>
                                        {segment.passengerCount} passager{segment.passengerCount > 0 ? 's' : ''}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <button onClick={() => setIsModalOpenGroup(true)}>
                <FaShare style={{fontSize: '25px', color: '#4C9BCE'}}/>
            </button>

            {isModalOpenGroup && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-content">
                            <button className="modal-close" onClick={() => setIsModalOpenGroup(false)}>×</button>

                            <div className="columns is-centered">
                                <div className="columns is-multiline is-mobile">
                                    <div className="column is-full">
                                        <select className="select">
                                            {groups.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    <span className="title is-6 has-text-weight-bold">{g.name}</span>
                                                    {' - '}
                                                    <span>{g.description}</span>
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="column is-full mt-3">
                                        <textarea
                                            className="textarea"
                                            placeholder="Type your message..."
                                            value={newMessage}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                    </div>

                                    <div className="column is-full">
                                        <button className="button is-info" onClick={() => shareTripInGroupChat(groups[0].id)}>
                                            <FaPaperPlane /> Send a message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Voyages = () => {
    const [form, setForm] = useState({
        origin: '',
        destination: '',
        flightType: 'one-way',
        departureDate: '',
        returnDate: '',
        travelClass: 'ECONOMY',
        adults: 1
    });

    const [results, setResults] = useState([]);
    const auth = getAuth(app);
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [cityCodes, setCityCodes] = useState({origin: {}, destination: {}});
    const [options, setOptions] = useState({origin: [], destination: []});
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);

    const debouncedOrigin = useDebounce(form.origin, 300);
    const debouncedDestination = useDebounce(form.destination, 300);

    const validateField = (name, value) => {

        let error = '';
        switch (name) {
            case 'origin':
            case 'destination':
                if (!value) error = 'Ce champ est requis';
                else if (!cityCodes[name][value.toLowerCase()]) {
                    console.warn('Codes disponibles:', cityCodes[name]);
                    error = 'Ville non reconnue';
                  }
                break;
            case 'departureDate':
                if (!isValid(new Date(value))) error = 'Date invalide';
                break;
            case 'returnDate':
                if (form.flightType === 'round-trip' && new Date(value) <= new Date(form.departureDate)) {
                    error = 'Doit être après la date de départ';
                }
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const fetchAutocomplete = async (type, keyword) => {
        if (!keyword || keyword.length < 2) return [];

        try {
            const response = await fetch(`/api/autocomplete?keyword=${encodeURIComponent(keyword)}`);
            if (!response.ok) throw new Error('Échec de la recherche');
            const data = await response.json();

            return data.reduce((acc, entry) => {
                acc.options.push(`${entry.name} (${entry.iataCode})`);
                acc.codes[`${entry.name} (${entry.iataCode})`.toLowerCase()] = entry.iataCode;
                return acc;
            }, { options: [], codes: {} });
        } catch (error) {
            console.error('Autocomplete error:', error);
            return { options: [], codes: {} };
        }
    };

    useEffect(() => {
        const updateAutocomplete = async (type) => {
            const { options: newOptions, codes } = await fetchAutocomplete(type, debouncedOrigin);
            setOptions(prev => ({ ...prev, [type]: newOptions }));
            setCityCodes(prev => ({ ...prev, [type]: codes }));
        };

        if (debouncedOrigin) updateAutocomplete('origin');
    }, [debouncedOrigin]);

    useEffect(() => {
        const updateAutocomplete = async (type) => {
            const { options: newOptions, codes } = await fetchAutocomplete(type, debouncedDestination);
            setOptions(prev => ({ ...prev, [type]: newOptions }));
            setCityCodes(prev => ({ ...prev, [type]: codes }));
        };

        if (debouncedDestination) updateAutocomplete('destination');
    }, [debouncedDestination]);

    const handleSearch = async () => {
        const isValidForm = Object.keys(form).every(field => {
            if (field === 'returnDate' && form.flightType === 'one-way') return true;
            return validateField(field, form[field]);
        });

        if (!isValidForm) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                origin: cityCodes.origin[form.origin.toLowerCase()],
                destination: cityCodes.destination[form.destination.toLowerCase()],
                departureDate: form.departureDate,
                adults: form.adults,
                travelClass: form.travelClass,
                currency: 'CAD',
                ...(form.flightType === 'round-trip' && { returnDate: form.returnDate })
            });



            const response = await fetch(`/api/search?${params}`);
            console.log(response);
            const { data } = await response.json();
            console.log('API Response:', data);
            setResults(data?.offers || data || []);

            if (!response.ok) throw new Error(data?.errors?.[0]?.detail || 'Erreur inconnue');
            setResults(data || []);
        } catch (error) {
            setErrors({ general: error.message });
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

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
        <div className="max-w-4xl mx-auto p-4">
            {/* Navbar */}
            <nav className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <Link to="/" className="text-4xl font-extrabold text-blue-500">Coplanify</Link>
                    <div className="flex items-center space-x-8">
                        {user ? (
                            <>
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
                                        <Link to="/chat" className="text-lg text-gray-700 hover:text-gray-900">
                                            Groupes
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/amis" className="text-lg text-gray-700 hover:text-gray-900">
                                            Amis
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/profil" className="text-lg text-gray-700 hover:text-gray-900">
                                            Profil
                                        </Link>
                                    </li>
                                </ul>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-6 py-3 text-lg font-semibold rounded-full shadow-lg hover:bg-red-600 hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Se déconnecter
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="bg-blue-500 text-white px-6 py-3 text-lg font-semibold rounded-full shadow-lg hover:bg-blue-600 hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Se connecter
                            </button>
                        )}
                    </div>
                </div>
            </nav>
            {/* Search Form */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Départ de</label>
                        <div className="relative">
                            <input
                                list="originOptions"
                                value={form.origin}
                                onChange={(e) => setForm(prev => ({ ...prev, origin: e.target.value }))}
                                className={`w-full p-3 rounded-lg border ${errors.origin ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-blue-400`}
                                placeholder="Paris (CDG)"
                            />
                            <datalist id="originOptions">
                                {(options.origin && Array.isArray(options.origin)) ?
                                    options.origin.map((opt, idx) => <option key={idx} value={opt} />)
                                    : null}
                            </datalist>
                            {errors.origin && <p className="text-red-500 text-sm mt-1">{errors.origin}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Destination</label>
                        <div className="relative">
                            <input
                                list="destinationOptions"
                                value={form.destination}
                                onChange={(e) => setForm(prev => ({ ...prev, destination: e.target.value }))}
                                className={`w-full p-3 rounded-lg border ${errors.destination ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-blue-400`}
                                placeholder="New York (JFK)"
                            />
                            <datalist id="destinationOptions">
                                {(options.destination && Array.isArray(options.destination)) ?
                                    options.destination.map((opt, idx) => <option key={idx} value={opt} />)
                                    : null}
                            </datalist>
                            {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination}</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Date de départ</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={form.departureDate}
                                onChange={(e) => setForm(prev => ({ ...prev, departureDate: e.target.value }))}
                                className={`w-full p-3 rounded-lg border ${errors.departureDate ? 'border-red-500' : 'border-gray-200'}`}
                                min={format(new Date().setHours(0,0,0,0), 'yyyy-MM-dd')}
                            />
                            {errors.departureDate && <p className="text-red-500 text-sm mt-1">{errors.departureDate}</p>}
                        </div>
                    </div>

                    {form.flightType === 'round-trip' && (
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Date de retour</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={form.returnDate}
                                    onChange={(e) => setForm(prev => ({ ...prev, returnDate: e.target.value }))}
                                    className={`w-full p-3 rounded-lg border ${errors.returnDate ? 'border-red-500' : 'border-gray-200'}`}
                                    min={form.departureDate}
                                />
                                {errors.returnDate && <p className="text-red-500 text-sm mt-1">{errors.returnDate}</p>}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Type de vol</label>
                        <select
                            value={form.flightType}
                            onChange={(e) => setForm(prev => ({ ...prev, flightType: e.target.value }))}
                            className="w-full p-3 rounded-lg border border-gray-200"
                        >
                            <option value="one-way">Aller simple</option>
                            <option value="round-trip">Aller-retour</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Classe</label>
                        <select
                            value={form.travelClass}
                            onChange={(e) => setForm(prev => ({ ...prev, travelClass: e.target.value }))}
                            className="w-full p-3 rounded-lg border border-gray-200"
                        >
                            <option value="ECONOMY">Économique</option>
                            <option value="PREMIUM_ECONOMY">Premium Économique</option>
                            <option value="BUSINESS">Affaires</option>
                            <option value="FIRST">Première</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Passagers</label>
                        <div className="flex items-center gap-2">
                            <FiUsers className="text-gray-400" />
                            <input
                                type="number"
                                min="1"
                                value={form.adults}
                                onChange={(e) => setForm(prev => ({ ...prev, adults: Math.max(1, e.target.value) }))}
                                className="w-full p-3 rounded-lg border border-gray-200"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className={`w-full py-4 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2
            ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            <FiSearch className="text-lg" />
                            Rechercher des vols
                        </>
                    )}
                </button>

                {errors.general && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                        <FiXCircle />
                        {errors.general}
                    </div>
                )}
            </div>

            {/* Resultat */}
            {results.length > 0 ? (
                <div className="space-y-4">
                    {results.map((offer, idx) => (
                        <FlightResultCard key={idx} offer={offer} currency="CAD" />
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="text-center py-12 text-gray-500">
                        <FiSearch className="mx-auto text-3xl mb-4" />
                        <p>Aucun vol trouvé. Essayez de modifier vos critères de recherche.</p>
                    </div>
                )
            )}

            {/* Loading */}
            {loading && (
                <div className="space-y-4 animate-pulse">
                    {[...Array(3)].map((_, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-lg p-6 h-32"></div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Voyages;