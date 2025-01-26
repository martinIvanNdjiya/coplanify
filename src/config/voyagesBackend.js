import Amadeus from "amadeus";
import express from "express";
import bodyParser from "body-parser";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const amadeus = new Amadeus({
    clientId: 'pgggkfu2yO1Wg049eD6nonuL5jmGGAlA',
    clientSecret: 'VNBhnePRZdEB2Rq4',
});
app.use(bodyParser.json());
const port = 3000;

app.use(express.static("public"));

app.get("/api/autocomplete", async (request, response) => {
    try {
        const { query } = request;
        const { data } = await amadeus.referenceData.locations.get({
            keyword: query.keyword,
            subType: Amadeus.location.city,
        });
        response.json(data);
    } catch (error) {
        console.error(error.response);
        response.json([]);
    }
});

app.get("/api/search", async (request, response) => {
    try {
        const { query } = request;
        const { data } = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: query.origin,
            destinationLocationCode: query.destination,
            departureDate: query.departureDate,
            adults: query.adults,
            ...(query.returnDate ? { returnDate: query.returnDate } : {}),
        });
        response.json(data);
    } catch (error) {
        console.error(error.response);
        response.json([]);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});