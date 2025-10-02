const axios = require("axios");
const { getLocationName } = require("../utils/locationHelper");

const getWeather = async (req, res) => {
  try {
    const lat = req.query.lat || 11.0168;
    const lon = req.query.lon || 76.9558;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    const locationInfo = await getLocationName(lat, lon);

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );

    const data = response.data;

    const transformed = {
      name: locationInfo.name,
      fullName: locationInfo.fullName,
      coordinates: { lat, lon },
      sys: { country: data.sys.country || "IN", state: locationInfo.state, sunrise: data.sys.sunrise, sunset: data.sys.sunset },
      main: {
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        temp_min: Math.round(data.main.temp_min),
        temp_max: Math.round(data.main.temp_max),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
      },
      wind: { speed: data.wind.speed, deg: data.wind.deg },
      clouds: { all: data.clouds.all },
      weather: data.weather,
      dt: data.dt,
      timezone: "Asia/Kolkata",
    };

    res.json(transformed);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
};

module.exports = { getWeather };
