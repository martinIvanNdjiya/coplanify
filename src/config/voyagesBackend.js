import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from 'dotenv';
import Amadeus from "amadeus";

dotenv.config();

console.log('AMADEUS_CLIENT_ID:', process.env.AMADEUS_CLIENT_ID);

const app = express();
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Routes
app.get("/api/autocomplete", async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.length < 2) {
      return res.status(400).json({
        error: "Le paramètre 'keyword' est requis (min 2 caractères)"
      });
    }

    const { data } = await amadeus.referenceData.locations.get({
      keyword,
      subType: 'CITY,AIRPORT',
      view: 'LIGHT'
    });

    res.json(data);
  } catch (error) {
    console.error('Amadeus API Error:', error.response?.data || error);
    res.status(500).json({
      error: true,
      message: error.message,
      errors: error.response?.data?.errors || []
    });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const params = {
      originLocationCode: req.query.origin,
      destinationLocationCode: req.query.destination,
      departureDate: req.query.departureDate,
      adults: parseInt(req.query.adults, 10),
      travelClass: req.query.travelClass,
      currencyCode: req.query.currency || 'USD',
      nonStop: req.query.nonStop === 'true'
    };

    const { data } = await amadeus.shopping.flightOffersSearch.get(params);

    res.json({
      data: data,
      meta: { count: data.length }
    });
  } catch (error) {
    const status = error.response?.statusCode || 500;
    res.status(status).json({
      error: true,
      message: error.message,
      errors: error.response?.data?.errors || []
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});