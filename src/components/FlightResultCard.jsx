import PropTypes from "prop-types";
import { format } from "date-fns";
import { FiClock, FiArrowRight } from "react-icons/fi";

const FlightResultCard = ({ offer }) => {
  const { price, itineraries, oneWay } = offer;

  const calculDureeHeures = (dureeIso) => {
    if (!dureeIso) return 0;
    return dureeIso.replace("PT", "");
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 mb-6 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
    >
      <div className="p-6 flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 px-4 py-2 rounded-full">
              <span className="text-blue-600 font-semibold">
                {price.currency} {price.total}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {oneWay ? "Aller Simple" : "Aller-Retour"}
            </span>
          </div>

          {itineraries.map((itinerary, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <FiClock className="text-blue-500" />
                <span className="font-medium">
                  {calculDureeHeures(itinerary.duration)}
                </span>
              </div>

              {itinerary.segments.map((segment, segmentIdx) => (
                <div
                  key={segmentIdx}
                  className="border-l-2 border-blue-200 pl-4 ml-2"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {format(new Date(segment.departure.at), "HH:mm")}
                        </span>
                        <FiArrowRight className="text-gray-400" />
                        <span className="font-semibold text-lg">
                          {format(new Date(segment.arrival.at), "HH:mm")}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {segment.departure.iataCode} →{" "}
                        {segment.arrival.iataCode}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

FlightResultCard.propTypes = {
  offer: PropTypes.object.isRequired,
};

export default FlightResultCard;