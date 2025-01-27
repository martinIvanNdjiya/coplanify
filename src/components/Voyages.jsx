import {useState, useEffect, useRef} from 'react';

const Voyages = () => {
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [flightType, setFlightType] = useState("one-way");
    const [departureDate, setDepartureDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [showReturnDate, setShowReturnDate] = useState(false);
    const [travelClass, setTravelClass] = useState("ECONOMY");
    const [adults, setAdults] = useState(1);
    const [searchDisabled, setSearchDisabled] = useState(true);
    const [results, setResults] = useState([]);
    const [originCityCodes, setOriginCityCodes] = useState({});
    const [destinationCityCodes, setDestinationCityCodes] = useState({});
    const [originOptions, setOriginOptions] = useState([]);
    const [destinationOptions, setDestinationOptions] = useState([]);

    const autocompleteTimeout = useRef(null);
    const debounceTime = 500;

    useEffect(() => {
        const isFormValid =
            origin !== "" &&
            destination !== "" &&
            departureDate !== "" &&
            (flightType === "one-way" || (flightType === "round-trip" && returnDate !== "")) &&
            adults > 0;

        setSearchDisabled(!isFormValid);
    }, [origin, destination, flightType, departureDate, returnDate, adults]);

    const reset = () => {
        setOrigin("");
        setDestination("");
        setFlightType("one-way");
        setDepartureDate("");
        setReturnDate("");
        setShowReturnDate(false);
        setTravelClass("ECONOMY");
        setAdults(1);
        setSearchDisabled(true);
    };

    const autocomplete = async (input, setCityCodes, setOptions) => {
        if (autocompleteTimeout.current) {
            clearTimeout(autocompleteTimeout.current);
        }

        autocompleteTimeout.current = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ keyword: input });
                const response = await fetch(`/api/autocomplete?${params}`);
                    const data = await response.json();

                    const cityCodes = {};
                    const options = data.map((entry) => {
                        cityCodes[entry.name.toLowerCase()] = entry.iataCode;
                        return entry.name;
                    });

                    setCityCodes(cityCodes);
                    setOptions(options);
            } catch (error) {
                console.error(error);
            }
        }, debounceTime);
    };

    useEffect(() => {
        if (origin) {
            autocomplete(origin, setOriginCityCodes, setOriginOptions);
        }
    }, [origin]);

    useEffect(() => {
        if (destination) {
            autocomplete(destination, setDestinationCityCodes, setDestinationOptions);
        }
    }, [destination]);

    const search = async () => {
        try {
            const returns = flightType === "round-trip";
            const params = new URLSearchParams({
                origin: originCityCodes[origin.toLowerCase()],
                destination: destinationCityCodes[destination.toLowerCase()],
                departureDate: departureDate,
                adults: Math.abs(parseInt(adults)),
                travelClass: travelClass,
                ...(returns ? { returnDate: returnDate } : {}),
            });
            const response = await fetch(`/api/search?${params}`);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            {/* Locations Card */}
            <div className="my-2 card shadow-md rounded-lg">
                <div className="card-body">
                    <h5 className="card-title text-xl font-semibold mb-4">Locations</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Origin */}
                        <div>
                            <div className="mb-2">
                                <label htmlFor="origin-input" className="form-label block text-sm font-medium">Origin</label>
                                <div className="input-group flex items-center">
                                    <span className="input-group-text p-2 bg-gray-200 text-gray-700">
                                        <i className="bi-pin-map"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control p-2 border rounded-md w-full"
                                        placeholder="Location"
                                        value={origin}
                                        onChange={(e) => {
                                            setOrigin(e.target.value);
                                        }}
                                    />
                                    <datalist>
                                        {originOptions.map((option, index) => (
                                            <option key={index} value={option}></option>
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* Destination */}
                        <div>
                            <div className="mb-2">
                                <label htmlFor="destination-input" className="form-label block text-sm font-medium">Destination</label>
                                <div className="input-group flex items-center">
                                    <span className="input-group-text p-2 bg-gray-200 text-gray-700">
                                        <i className="bi-pin-map-fill"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control p-2 border rounded-md w-full"
                                        placeholder="Location"
                                        value={destination}
                                        onChange={(e) => {
                                            setDestination(e.target.value);
                                        }}
                                    />
                                    <datalist >
                                        {destinationOptions.map((option, index) => (
                                            <option key={index} value={option}></option>
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dates Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="mb-2">
                    <div className="h-full card shadow-md rounded-lg">
                        <div className="card-body">
                            <h5 className="card-title text-xl font-semibold mb-4">Dates</h5>
                            <div className="mb-4">
                                <label htmlFor="flight-type-select" className="form-label block text-sm font-medium">Flight Type</label>
                                <select
                                    id="flight-type-select"
                                    className="form-select p-2 border rounded-md w-full"
                                    value={flightType}
                                    onChange={(e) => {
                                        setFlightType(e.target.value);
                                        setShowReturnDate(e.target.value === "round-trip");
                                    }}
                                >
                                    <option value="one-way">One-way</option>
                                    <option value="round-trip">Round-trip</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="departure-date-input" className="form-label block text-sm font-medium">Departure Date</label>
                                <input
                                    type="date"
                                    className="form-control p-2 border rounded-md w-full"
                                    value={departureDate}
                                    onChange={(e) => setDepartureDate(e.target.value)}
                                />
                            </div>

                            {showReturnDate && (
                                <div className="mb-4">
                                    <label htmlFor="return-date-input" className="form-label block text-sm font-medium">Return Date</label>
                                    <input
                                        type="date"
                                        className="form-control p-2 border rounded-md w-full"
                                        value={returnDate}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Card */}
                <div className="mb-2">
                    <div className="h-full card shadow-md rounded-lg">
                        <div className="card-body">
                            <h5 className="card-title text-xl font-semibold mb-4">Details</h5>

                            {/* Travel Class */}
                            <div className="mb-4">
                                <label htmlFor="travel-class-select" className="form-label block text-sm font-medium">Travel Class</label>
                                <select
                                    id="travel-class-select"
                                    className="form-select p-2 border rounded-md w-full"
                                    value={travelClass}
                                    onChange={(e) => setTravelClass(e.target.value)}
                                >
                                    <option value="ECONOMY">Economy</option>
                                    <option value="PREMIUM_ECONOMY">Premium Economy</option>
                                    <option value="BUSINESS">Business</option>
                                    <option value="FIRST">First</option>
                                </select>
                            </div>

                            {/* Passengers */}
                            <div className="mb-4">
                                <label htmlFor="adults-input" className="form-label block text-sm font-medium">Adults</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-control p-2 border rounded-md w-full"
                                    value={adults}
                                    onChange={(e) => setAdults(parseInt(e.target.value))}
                                />
                                <span className="form-text text-sm text-gray-500">12 years old and older</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Button */}
            <button
                className={`w-full py-2 mt-4 bg-blue-500 text-white rounded-md ${searchDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={searchDisabled}
                onClick={search}
            >
                Search
            </button>

            {/* Display Results */}
            {results.length > 0 && (
                <ul>
                    {results.map(({itineraries, price}, index) => {
                        const priceLabel = `${price.total} ${price.currency}`;
                        return (
                            <li
                                key={index}
                                className="flex-column flex-sm-row list-group-item d-flex justify-content-between align-items-sm-center"
                            >
                                {itineraries.map((itinerary, index) => {
                                    const [, hours, minutes] = itinerary.duration.match(/(\d+)H(\d+)?/);
                                    const travelPath = itinerary.segments
                                        .flatMap(({arrival, departure}, idx, segments) => {
                                            if (idx === segments.length - 1) {
                                                return [departure.iataCode, arrival.iataCode];
                                            }
                                            return [departure.iataCode];
                                        })
                                        .join(" → ");
                                    return (
                                        <div key={index} className="flex-column flex-1 m-2 d-flex">
                                            <small className="text-muted">
                                                {index === 0 ? "Outbound" : "Return"}
                                            </small>
                                            <span className="fw-bold">{travelPath}</span>
                                            <div>{hours || 0}h {minutes || 0}m</div>
                                        </div>
                                    );
                                })}
                                <span className="bg-primary rounded-pill m-2 badge fs-6">{priceLabel}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default Voyages;
