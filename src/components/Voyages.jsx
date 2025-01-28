import { useState, useEffect, useRef, useCallback } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FiSearch, FiUsers, FiCalendar, FiArrowUpRight, FiClock, FiXCircle } from 'react-icons/fi';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const FlightResultCard = ({ offer, currency }) => {
    const parseDuration = (duration) => {
        const [days, rest] = duration.includes('D') ? duration.split('D') : ['0', duration];
        const [hours, minutes] = rest.replace('PT', '').split('H') || ['0', '0'];
        return {
            days: parseInt(days),
            hours: parseInt(hours),
            minutes: parseInt(minutes?.replace('M', '') || '0')
        };
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4 transition-transform hover:scale-[1.01]">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(offer.price.total)}
                    </span>
                    <span className="text-sm text-gray-500">({offer.numberOfBookableSeats} sièges restants)</span>
                </div>
                <div className="flex items-center gap-2">
                    {offer.validatingAirlineCodes.map((code, idx) => (
                        <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {code}
                        </span>
                    ))}
                </div>
            </div>

            {offer.itineraries.map((itinerary, idx) => {
                const { hours, minutes } = parseDuration(itinerary.duration);
                return (
                    <div key={idx} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 mb-3 text-gray-600">
                            <FiClock className="shrink-0" />
                            <span className="font-medium">
                                {idx === 0 ? 'Aller' : 'Retour'} • {hours}h {minutes}m
                            </span>
                        </div>

                        {itinerary.segments.map((segment, segIdx) => (
                            <div key={segIdx} className="flex items-center gap-4 py-2 border-t">
                                <div className="shrink-0 w-20 text-sm">
                                    {format(parseISO(segment.departure.at), 'HH:mm', { locale: fr })}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{segment.departure.iataCode} → {segment.arrival.iataCode}</div>
                                    <div className="text-sm text-gray-500">{segment.carrierCode} {segment.aircraft.code}</div>
                                </div>
                                <div className="shrink-0 w-20 text-sm text-right">
                                    {format(parseISO(segment.arrival.at), 'HH:mm', { locale: fr })}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
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
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [cityCodes, setCityCodes] = useState({ origin: {}, destination: {} });
    const [options, setOptions] = useState({ origin: [], destination: [] });

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
                currency: 'EUR',
                ...(form.flightType === 'round-trip' && { returnDate: form.returnDate })
            });



            const response = await fetch(`/api/search?${params}`);
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

    return (
        <div className="max-w-4xl mx-auto p-4">
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
                                {options.origin.map((opt, idx) => <option key={idx} value={opt} />)}
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
                                {options.destination.map((opt, idx) => <option key={idx} value={opt} />)}
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
                        <FlightResultCard key={idx} offer={offer} currency="EUR" />
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