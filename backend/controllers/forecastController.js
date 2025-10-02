const axios = require("axios");
const { getLocationName } = require("../utils/locationHelper");

const getForecast = async (req, res) => {
  try {
    const lat = req.query.lat || 11.0168;
    const lon = req.query.lon || 76.9558;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    const locationInfo = await getLocationName(lat, lon);

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );

    const forecastData = response.data;

    const transformed = {
      city: {
        name: locationInfo.name,
        fullName: locationInfo.fullName,
        country: locationInfo.country === "India" ? "IN" : locationInfo.country,
        state: locationInfo.state,
        coordinates: { lat, lon },
      },
      list: forecastData.list.map(item => ({
        dt: item.dt,
        main: {
          temp: Math.round(item.main.temp),
          temp_min: Math.round(item.main.temp_min),
          temp_max: Math.round(item.main.temp_max),
          feels_like: Math.round(item.main.feels_like),
          humidity: item.main.humidity,
          pressure: item.main.pressure,
        },
        weather: item.weather,
        wind: item.wind,
        clouds: item.clouds,
        rain: item.rain || null,
        dt_txt: item.dt_txt,
      })),
    };

    res.json(transformed);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch forecast data" });
  }
};

module.exports = { getForecast };
