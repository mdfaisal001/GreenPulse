const axios = require("axios");

const kelvinToCelsius = k => Math.round(k - 273.15);

const getAgroData = async (req, res) => {
  try {
    const lat = req.query.lat || 11.0168;
    const lon = req.query.lon || 76.9558;
    const apiKey = process.env.AGRO_API_KEY;

    const response = await axios.get(
      `http://api.agromonitoring.com/agro/1.0/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );

    const data = response.data;

    res.json({
      coordinates: { lat, lon },
      main: { temp: kelvinToCelsius(data.main.temp), humidity: data.main.humidity, pressure: data.main.pressure },
      wind: data.wind,
      clouds: data.clouds,
      rain: data.rain || null,
      dt: data.dt,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch agro data" });
  }
};

module.exports = { getAgroData };
