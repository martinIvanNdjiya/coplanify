import { useState } from 'react';

const Voyages = () => {
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        flightType: 'one-way',
        departureDate: '',
        returnDate: '',
        adults: 1,
    });

    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [isSearchEnabled, setIsSearchEnabled] = useState(false);
    const [searchResults, setSearchResults] = useState([]); // State for search results


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => {
            const newData = { ...prevData, [name]: value };
            checkFormCompletion(newData);
            return newData;
        });
    };

    const checkFormCompletion = (data) => {
        const isComplete =
            data.origin &&
            data.destination &&
            data.departureDate &&
            (data.flightType === 'one-way' || data.returnDate);
        setIsSearchEnabled(isComplete);
    };

    const handleFlightTypeChange = (e) => {
        const { value } = e.target;
        setFormData((prevData) => {
            const newData = { ...prevData, flightType: value };
            if (value === 'one-way') newData.returnDate = '';
            checkFormCompletion(newData);
            return newData;
        });
    };

    const handleSearchClick = async () => {
        try {
            const params = new URLSearchParams({
                origin: formData.origin,
                destination: formData.destination,
                departureDate: formData.departureDate,
                adults: formData.adults,
                ...(formData.flightType === 'round-trip' && {returnDate: formData.returnDate}),
            });

            const response = await fetch(`/api/search?${params}`);
            const data = await response.json();
            setSearchResults(data);


            if (data.length === 0) {
                alert('No flights found.');
            }
        } catch (error) {
            console.error('Flight search error:', error);
            alert('Something went wrong while fetching flight details. Please try again.');
        }
    };

    const [autocompleteTimeout, setAutocompleteTimeout] = useState(null);

    const autocomplete = async (keyword, field) => {
        clearTimeout(autocompleteTimeout);
        setAutocompleteTimeout(setTimeout(async () => {
            try {
                const response = await fetch(`/api/autocomplete?keyword=${keyword}`);
                const data = await response.json();
                if (field === 'origin') {
                    setOriginSuggestions(data);
                } else if (field === 'destination') {
                    setDestinationSuggestions(data);
                }
            } catch (error) {
                console.error('Autocomplete error:', error);
            }
        }, 300));
    };

    return (
        <div className="container mx-auto p-6">
            <div className="card bg-white shadow-lg p-6 mb-6">
                <h5 className="text-xl font-bold mb-4">Locations</h5>
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
                            Origin
                        </label>
                        <input
                            type="text"
                            id="origin"
                            name="origin"
                            value={formData.origin}
                            onChange={(e) => {
                                handleInputChange(e);
                                autocomplete(e.target.value, 'origin');
                            }}
                            className="mt-2 p-2 w-full border rounded-lg"
                            placeholder="Location"
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                            Destination
                        </label>
                        <input
                            type="text"
                            id="destination"
                            name="destination"
                            value={formData.destination}
                            onChange={(e) => {
                                handleInputChange(e);
                                autocomplete(e.target.value, 'destination');
                            }}
                            className="mt-2 p-2 w-full border rounded-lg"
                            placeholder="Location"
                        />
                        <datalist id="destination-options">
                            {destinationSuggestions.map((suggestion) => (
                                <option key={suggestion.iataCode} value={suggestion.name}/>
                            ))}
                        </datalist>
                    </div>
                </div>
            </div>

            <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                    <div className="card bg-white shadow-lg p-6">
                    <h5 className="text-xl font-bold mb-4">Dates</h5>
                        <div className="mb-4">
                            <label htmlFor="flight-type" className="block text-sm font-medium text-gray-700">
                                Flight Type
                            </label>
                            <select
                                id="flight-type"
                                name="flightType"
                                value={formData.flightType}
                                onChange={handleFlightTypeChange}
                                className="mt-2 p-2 w-full border rounded-lg"
                            >
                                <option value="one-way">One-way</option>
                                <option value="round-trip">Round-trip</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">
                                Departure Date
                            </label>
                            <input
                                type="date"
                                id="departureDate"
                                name="departureDate"
                                value={formData.departureDate}
                                onChange={handleInputChange}
                                className="mt-2 p-2 w-full border rounded-lg"
                            />
                        </div>
                        {formData.flightType === 'round-trip' && (
                            <div className="mb-4">
                                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">
                                    Return Date
                                </label>
                                <input
                                    type="date"
                                    id="returnDate"
                                    name="returnDate"
                                    value={formData.returnDate}
                                    onChange={handleInputChange}
                                    className="mt-2 p-2 w-full border rounded-lg"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1">
                    <div className="card bg-white shadow-lg p-6">
                        <h5 className="text-xl font-bold mb-4">Details</h5>
                        <div className="mb-4">
                            <label htmlFor="adults" className="block text-sm font-medium text-gray-700">
                                Adults
                            </label>
                            <input
                                type="number"
                                id="adults"
                                name="adults"
                                value={formData.adults}
                                onChange={handleInputChange}
                                min="0"
                                className="mt-2 p-2 w-full border rounded-lg"
                            />
                        </div>

                    </div>
                </div>
            </div>

            <div className="mb-6">
                <button
                    onClick={handleSearchClick}
                    disabled={!isSearchEnabled}
                    className={`w-full py-3 px-4 bg-blue-500 text-white rounded-lg ${!isSearchEnabled && 'opacity-50 cursor-not-allowed'}`}
                >
                    Search
                </button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
                <div className="results">
                    <h3 className="text-2xl font-semibold mb-4">Search Results</h3>
                    <ul className="space-y-4">
                        {searchResults.map(({ itineraries, price }, idx) => {
                            const priceLabel = `${price.total} ${price.currency}`;
                            return (
                                <li key={idx} className="flex flex-col sm:flex-row justify-between items-center bg-white shadow-lg p-4 rounded-lg">
                                    <div className="flex flex-col sm:flex-row">
                                        {itineraries.map((itinerary, index) => {
                                            const [, hours, minutes] = itinerary.duration.match(/(\d+)H(\d+)?/);
                                            const travelPath = itinerary.segments
                                                .flatMap(({ arrival, departure }, index, segments) => {
                                                    if (index === segments.length - 1) {
                                                        return [departure.iataCode, arrival.iataCode];
                                                    }
                                                    return [departure.iataCode];
                                                })
                                                .join(' → ');

                                            return (
                                                <div key={index} className="flex flex-col m-2 sm:w-1/3">
                                                    <small className="text-sm text-gray-500">{index === 0 ? 'Outbound' : 'Return'}</small>
                                                    <span className="font-bold">{travelPath}</span>
                                                    <div>{hours || 0}h {minutes || 0}m</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span className="bg-blue-500 text-white rounded-full px-4 py-1 text-lg">{priceLabel}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Voyages;
