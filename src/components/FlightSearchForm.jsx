import PropTypes from "prop-types";
import { FiSearch, FiUsers, FiXCircle } from "react-icons/fi";
import { format } from "date-fns";
import { useEffect, useState } from "react";

const FlightSearchForm = ({ onSubmit, form, setForm, errors, options, setOptions, setCityCodes, loading }) => {
  const [debouncedOrigin, setDebouncedOrigin] = useState(form.origin);
  const [debouncedDestination, setDebouncedDestination] = useState(form.destination);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedOrigin(form.origin);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [form.origin]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDestination(form.destination);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [form.destination]);

  const fetchAutocomplete = async (type, keyword) => {
    if (!keyword || keyword.length < 2) return [];

    try {
      const response = await fetch(
        `/api/autocomplete?keyword=${encodeURIComponent(keyword)}`
      );
      if (!response.ok) throw new Error("Échec de la recherche");
      const data = await response.json();

      return data.reduce(
        (acc, entry) => {
          acc.options.push(`${entry.name} (${entry.iataCode})`);
          acc.codes[`${entry.name} (${entry.iataCode})`.toLowerCase()] =
            entry.iataCode;
          return acc;
        },
        { options: [], codes: {} }
      );
    } catch (error) {
      console.error("Autocomplete error:", error);
      return { options: [], codes: {} };
    }
  };

  useEffect(() => {
    const updateAutocomplete = async (type) => {
      const { options: newOptions, codes } = await fetchAutocomplete(
        type,
        debouncedOrigin
      );
      setOptions((prev) => ({ ...prev, [type]: newOptions }));
      setCityCodes((prev) => ({ ...prev, [type]: codes }));
    };

    if (debouncedOrigin) updateAutocomplete("origin");
  }, [debouncedOrigin, setOptions, setCityCodes]);

  useEffect(() => {
    const updateAutocomplete = async (type) => {
      const { options: newOptions, codes } = await fetchAutocomplete(
        type,
        debouncedDestination
      );
      setOptions((prev) => ({ ...prev, [type]: newOptions }));
      setCityCodes((prev) => ({ ...prev, [type]: codes }));
    };

    if (debouncedDestination) updateAutocomplete("destination");
  }, [debouncedDestination, setOptions, setCityCodes]);

  return (
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-5xl font-extrabold text-center text-blue-500 mb-6">
          Trouvez votre prochain voyage
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Départ de
            </label>
            <div className="relative">
              <input
                list="originOptions"
                value={form.origin}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, origin: e.target.value }))
                }
                className={`w-full p-3 rounded-lg border ${
                  errors.origin ? "border-red-500" : "border-gray-200"
                } focus:ring-2 focus:ring-blue-400`}
                placeholder="Paris (CDG)"
              />
              <datalist id="originOptions">
                {options.origin && Array.isArray(options.origin)
                  ? options.origin.map((opt, idx) => (
                      <option key={idx} value={opt} />
                    ))
                  : null}
              </datalist>
              {errors.origin && (
                <p className="text-red-500 text-sm mt-1">{errors.origin}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Destination
            </label>
            <div className="relative">
              <input
                list="destinationOptions"
                value={form.destination}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, destination: e.target.value }))
                }
                className={`w-full p-3 rounded-lg border ${
                  errors.destination ? "border-red-500" : "border-gray-200"
                } focus:ring-2 focus:ring-blue-400`}
                placeholder="New York (JFK)"
              />
              <datalist id="destinationOptions">
                {options.destination && Array.isArray(options.destination)
                  ? options.destination.map((opt, idx) => (
                      <option key={idx} value={opt} />
                    ))
                  : null}
              </datalist>
              {errors.destination && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.destination}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Date de départ
            </label>
            <div className="relative">
              <input
                type="date"
                value={form.departureDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    departureDate: e.target.value,
                  }))
                }
                className={`w-full p-3 rounded-lg border ${
                  errors.departureDate ? "border-red-500" : "border-gray-200"
                }`}
                min={format(new Date().setHours(0, 0, 0, 0), "yyyy-MM-dd")}
              />
              {errors.departureDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.departureDate}
                </p>
              )}
            </div>
          </div>

          {form.flightType === "round-trip" && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Date de retour
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={form.returnDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, returnDate: e.target.value }))
                  }
                  className={`w-full p-3 rounded-lg border ${
                    errors.returnDate ? "border-red-500" : "border-gray-200"
                  }`}
                  min={form.departureDate}
                />
                {errors.returnDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.returnDate}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Type de vol
            </label>
            <select
              value={form.flightType}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, flightType: e.target.value }))
              }
              className="w-full p-3 rounded-lg border border-gray-200"
            >
              <option value="one-way">Aller simple</option>
              <option value="round-trip">Aller-retour</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Classe
            </label>
            <select
              value={form.travelClass}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, travelClass: e.target.value }))
              }
              className="w-full p-3 rounded-lg border border-gray-200"
            >
              <option value="ECONOMY">Économique</option>
              <option value="PREMIUM_ECONOMY">Premium Économique</option>
              <option value="BUSINESS">Affaires</option>
              <option value="FIRST">Première</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Passagers
            </label>
            <div className="flex items-center gap-2">
              <FiUsers className="text-gray-400" />
              <input
                type="number"
                min="1"
                value={form.adults}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    adults: Math.max(1, e.target.value),
                  }))
                }
                className="w-full p-3 rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className={`w-full py-4 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2
            ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
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
  );
};

FlightSearchForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  options: PropTypes.object.isRequired,
  setOptions: PropTypes.func.isRequired,
  cityCodes: PropTypes.object.isRequired,
  setCityCodes: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default FlightSearchForm;
