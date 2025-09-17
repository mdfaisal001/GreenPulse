const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to convert Kelvin to Celsius
const kelvinToCelsius = (kelvin) => {
  return Math.round(kelvin - 273.15);
};

// Helper function to get weather icon mapping
const getWeatherIcon = (agroWeatherId) => {
  const iconMap = {
    200: "11d", // thunderstorm
    300: "09d", // drizzle
    500: "10d", // rain
    600: "13d", // snow
    700: "50d", // mist/fog
    800: "01d", // clear
    801: "02d", // few clouds
    802: "03d", // scattered clouds
    803: "04d", // broken clouds
    804: "04d"  // overcast
  };
  
  const code = Math.floor(agroWeatherId / 100) * 100;
  return iconMap[code] || "01d";
};

// Helper function to get location name from coordinates
const getLocationName = async (lat, lon) => {
  try {
    const response = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const data = response.data;
    const cityName = data.city || data.locality || data.principalSubdivision || "Current Location";
    const state = data.principalSubdivision || "";
    const country = data.countryName || "India";
    
    return {
      name: cityName,
      state: state,
      country: country,
      fullName: `${cityName}${state ? ', ' + state : ''}`
    };
  } catch (error) {
    console.error("Location name fetch error:", error.message);
    return {
      name: "Current Location",
      state: "",
      country: "India",
      fullName: "Current Location"
    };
  }
};

// ✅ YOUR EXISTING WEATHER & FORECAST ENDPOINTS (unchanged)

// ✅ WEATHER ENDPOINT - Updated with location detection
app.get("/api/weather", async (req, res) => {
  try {
    console.log("🌤️ Weather endpoint hit!");
    
    // Use Trichy coordinates as default instead of Delhi
    const lat = req.query.lat || 10.7905; // Trichy latitude
    const lon = req.query.lon || 78.7047; // Trichy longitude
    const apiKey = process.env.AGRO_API_KEY;

    console.log(`Weather request for: ${lat}, ${lon}`);

    if (!apiKey) {
      return res.status(500).json({ error: "AgroMonitoring API key not configured" });
    }

    // Get location name first
    console.log("🌍 Getting location name...");
    const locationInfo = await getLocationName(lat, lon);
    console.log("📍 Location found:", locationInfo.fullName);

    // Weather API calls
    const weatherUrl = `http://api.agromonitoring.com/agro/1.0/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const sunUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;

    console.log("Fetching weather from:", weatherUrl);
    console.log("Fetching sun data from:", sunUrl);

    const [weatherResponse, sunResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(sunUrl)
    ]);

    const agroData = weatherResponse.data;
    const sunData = sunResponse.data;

    console.log("Weather API response received");
    console.log("Raw temperature (Kelvin):", agroData.main?.temp);
    console.log("Converted temperature (Celsius):", kelvinToCelsius(agroData.main?.temp || 0));

    const transformedData = {
      name: locationInfo.name,
      fullName: locationInfo.fullName,
      coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
      sys: {
        country: locationInfo.country === "India" ? "IN" : agroData.sys?.country || "IN",
        state: locationInfo.state,
        sunrise: new Date(sunData.results.sunrise).getTime() / 1000,
        sunset: new Date(sunData.results.sunset).getTime() / 1000
      },
      main: {
        temp: agroData.main?.temp ? kelvinToCelsius(agroData.main.temp) : 0,
        feels_like: agroData.main?.feels_like ? kelvinToCelsius(agroData.main.feels_like) : 0,
        temp_min: agroData.main?.temp_min ? kelvinToCelsius(agroData.main.temp_min) : 0,
        temp_max: agroData.main?.temp_max ? kelvinToCelsius(agroData.main.temp_max) : 0,
        humidity: agroData.main?.humidity || 0,
        pressure: agroData.main?.pressure || 0
      },
      wind: {
        speed: agroData.wind?.speed || 0,
        deg: agroData.wind?.deg || 0
      },
      clouds: {
        all: agroData.clouds?.all || 0
      },
      weather: [{
        id: agroData.weather?.[0]?.id || 800,
        main: agroData.weather?.[0]?.main || "Clear",
        description: agroData.weather?.[0]?.description || "clear sky",
        icon: getWeatherIcon(agroData.weather?.[0]?.id || 800)
      }],
      dt: agroData.dt || Math.floor(Date.now() / 1000),
      timezone: "Asia/Kolkata"
    };

    console.log("✅ Weather data transformed and sent for:", transformedData.fullName);
    res.json(transformedData);

  } catch (error) {
    console.error("❌ Weather API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to fetch weather data",
      details: error.response?.data || error.message
    });
  }
});

// ✅ FORECAST ENDPOINT - Updated with location detection
app.get("/api/forecast", async (req, res) => {
  try {
    // Use Trichy coordinates as default instead of Delhi
    const lat = req.query.lat || 10.7905; // Trichy latitude
    const lon = req.query.lon || 78.7047; // Trichy longitude
    const apiKey = process.env.AGRO_API_KEY;

    console.log(`📊 Forecast request for: ${lat}, ${lon}`);

    if (!apiKey) {
      return res.status(500).json({ error: "AgroMonitoring API key not configured" });
    }

    // Get location name
    const locationInfo = await getLocationName(lat, lon);

    // AgroMonitoring forecast API
    const forecastUrl = `http://api.agromonitoring.com/agro/1.0/weather/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    console.log("Fetching forecast from:", forecastUrl);
    const response = await axios.get(forecastUrl);
    const forecastData = response.data;

    console.log("Forecast response sample:", forecastData.slice(0, 2));

    // Transform to match frontend expectations
    const transformedForecast = {
      city: {
        name: locationInfo.name,
        fullName: locationInfo.fullName,
        country: locationInfo.country === "India" ? "IN" : "IN",
        state: locationInfo.state,
        coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) }
      },
      list: forecastData.map(item => ({
        dt: item.dt,
        main: {
          temp: item.main?.temp ? kelvinToCelsius(item.main.temp) : 0,
          temp_min: item.main?.temp_min ? kelvinToCelsius(item.main.temp_min) : 0,
          temp_max: item.main?.temp_max ? kelvinToCelsius(item.main.temp_max) : 0,
          humidity: item.main?.humidity || 0,
          feels_like: item.main?.feels_like ? kelvinToCelsius(item.main.feels_like) : 0,
          pressure: item.main?.pressure || 0
        },
        weather: [{
          id: item.weather?.[0]?.id || 800,
          main: item.weather?.[0]?.main || "Clear",
          description: item.weather?.[0]?.description || "clear sky",
          icon: getWeatherIcon(item.weather?.[0]?.id || 800)
        }],
        wind: {
          speed: item.wind?.speed || 0,
          deg: item.wind?.deg || 0
        },
        clouds: {
          all: item.clouds?.all || 0
        },
        rain: item.rain || null,
        dt_txt: new Date(item.dt * 1000).toISOString()
      }))
    };

    console.log("✅ Forecast data transformed - items:", transformedForecast.list.length);
    res.json(transformedForecast);

  } catch (error) {
    console.error("❌ Forecast API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to fetch forecast data",
      details: error.response?.data || error.message 
    });
  }
});

// ✅ LOCATION ENDPOINT - New endpoint to get user's location name
app.get("/api/location", async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    console.log(`🌍 Location request for: ${lat}, ${lon}`);
    const locationInfo = await getLocationName(lat, lon);
    
    res.json({
      ...locationInfo,
      coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) }
    });

  } catch (error) {
    console.error("❌ Location API Error:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch location data",
      details: error.message
    });
  }
});

// ✅ NEW POLYGON FEATURES (added without affecting existing endpoints)

// 1. Create polygon (farm boundary)
app.post("/api/polygons", async (req, res) => {
  try {
    const { name, geo_json } = req.body;
    const apiKey = process.env.AGRO_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "AgroMonitoring API key not configured" });
    }

    if (!name || !geo_json) {
      return res.status(400).json({ error: "Name and geo_json are required" });
    }

    const url = `http://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}`;
    
    console.log("🗺️ Creating farm polygon:", name);
    const response = await axios.post(url, { name, geo_json });

    console.log("✅ Farm polygon created:", response.data.id);
    res.json({
      success: true,
      polygon: response.data,
      message: `Farm "${name}" created successfully`
    });

  } catch (error) {
    console.error("❌ Polygon Creation Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to create farm polygon",
      details: error.response?.data || error.message 
    });
  }
});

// 2. List all user polygons
app.get("/api/polygons", async (req, res) => {
  try {
    const apiKey = process.env.AGRO_API_KEY;
    const url = `http://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}`;
    
    console.log("🗺️ Fetching user polygons...");
    const response = await axios.get(url);
    
    const polygons = response.data.map(polygon => ({
      ...polygon,
      area_hectares: polygon.area ? (polygon.area / 10000).toFixed(2) : "N/A",
      center: polygon.center || null
    }));

    console.log(`✅ Found ${polygons.length} farm polygons`);
    res.json({
      success: true,
      polygons: polygons,
      count: polygons.length
    });

  } catch (error) {
    console.error("❌ Polygons Fetch Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to fetch farm polygons",
      details: error.response?.data || error.message 
    });
  }
});

// 3. Get soil data for specific polygon
app.get("/api/soil/:polygonId", async (req, res) => {
  try {
    const { polygonId } = req.params;
    const apiKey = process.env.AGRO_API_KEY;
    const url = `http://api.agromonitoring.com/agro/1.0/soil?polyid=${polygonId}&appid=${apiKey}`;

    console.log("🌱 Fetching soil data for polygon:", polygonId);
    const response = await axios.get(url);
    const soilData = response.data;

    const transformedSoil = {
      polygon_id: polygonId,
      timestamp: soilData.dt,
      date: new Date(soilData.dt * 1000).toISOString(),
      surface_temp: soilData.t0 ? kelvinToCelsius(soilData.t0) : null,
      soil_temp_10cm: soilData.t10 ? kelvinToCelsius(soilData.t10) : null,
      moisture: soilData.moisture || null,
      raw_data: soilData
    };

    console.log("✅ Soil data retrieved for polygon");
    res.json({
      success: true,
      soil_data: transformedSoil,
      message: "Soil conditions for your farm"
    });

  } catch (error) {
    console.error("❌ Soil API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to fetch soil data",
      details: error.response?.data || error.message 
    });
  }
});

// 4. Get weather for specific polygon
app.get("/api/polygon-weather/:polygonId", async (req, res) => {
  try {
    const { polygonId } = req.params;
    const apiKey = process.env.AGRO_API_KEY;

    // Get polygon info first
    const polygonUrl = `http://api.agromonitoring.com/agro/1.0/polygons/${polygonId}?appid=${apiKey}`;
    const polygonResponse = await axios.get(polygonUrl);
    const polygon = polygonResponse.data;

    if (!polygon.center) {
      return res.status(400).json({ error: "Polygon center coordinates not available" });
    }

    const [lon, lat] = polygon.center;
    console.log(`🌤️ Fetching weather for polygon ${polygonId} at ${lat}, ${lon}`);

    // Get weather data for polygon center
    const weatherUrl = `http://api.agromonitoring.com/agro/1.0/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const sunUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;

    const [weatherResponse, sunResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(sunUrl)
    ]);

    const agroData = weatherResponse.data;
    const sunData = sunResponse.data;

    const transformedWeather = {
      polygon_id: polygonId,
      polygon_name: polygon.name,
      coordinates: { lat, lon },
      area_hectares: polygon.area ? (polygon.area / 10000).toFixed(2) : "N/A",
      weather: {
        temp: kelvinToCelsius(agroData.main?.temp || 0),
        feels_like: kelvinToCelsius(agroData.main?.feels_like || 0),
        temp_min: kelvinToCelsius(agroData.main?.temp_min || 0),
        temp_max: kelvinToCelsius(agroData.main?.temp_max || 0),
        humidity: agroData.main?.humidity || 0,
        pressure: agroData.main?.pressure || 0,
        description: agroData.weather?.[0]?.description || "clear sky",
        icon: getWeatherIcon(agroData.weather?.[0]?.id || 800)
      },
      wind: {
        speed: agroData.wind?.speed || 0,
        deg: agroData.wind?.deg || 0
      },
      sun: {
        sunrise: new Date(sunData.results.sunrise).getTime() / 1000,
        sunset: new Date(sunData.results.sunset).getTime() / 1000
      },
      timestamp: agroData.dt || Math.floor(Date.now() / 1000)
    };

    console.log("✅ Weather data retrieved for farm");
    res.json({
      success: true,
      weather_data: transformedWeather,
      message: `Weather conditions for farm "${polygon.name}"`
    });

  } catch (error) {
    console.error("❌ Weather API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to fetch weather data for farm",
      details: error.response?.data || error.message 
    });
  }
});

// 5. Get NDVI data for specific polygon
app.get("/api/polygon-ndvi/:polygonId", async (req, res) => {
  try {
    const { polygonId } = req.params;
    const { start, end } = req.query;
    const apiKey = process.env.AGRO_API_KEY;

    // Default to last 90 days if no range specified
    const startTime = start || Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    const endTime = end || Math.floor(Date.now() / 1000);

    const url = `http://api.agromonitoring.com/agro/1.0/ndvi/history?polyid=${polygonId}&start=${startTime}&end=${endTime}&appid=${apiKey}`;

    console.log(`📊 Fetching NDVI data for polygon ${polygonId}`);
    const response = await axios.get(url);
    const ndviData = response.data;

    // Transform NDVI data
    const transformedNDVI = ndviData.map(item => ({
      date: new Date(item.dt * 1000).toISOString().split('T')[0],
      timestamp: item.dt,
      ndvi: {
        min: item.data?.min || 0,
        max: item.data?.max || 0,
        mean: item.data?.mean || 0,
        std: item.data?.std || 0,
        num: item.data?.num || 0
      },
      cloud_coverage: item.cl || 0
    }));

    // Get polygon info
    const polygonUrl = `http://api.agromonitoring.com/agro/1.0/polygons/${polygonId}?appid=${apiKey}`;
    const polygonResponse = await axios.get(polygonUrl);
    const polygon = polygonResponse.data;

    console.log(`✅ NDVI data retrieved - ${transformedNDVI.length} records`);
    res.json({
      success: true,
      polygon_info: {
        id: polygon.id,
        name: polygon.name,
        area_hectares: polygon.area ? (polygon.area / 10000).toFixed(2) : "N/A"
      },
      ndvi_data: transformedNDVI,
      total_records: transformedNDVI.length
    });

  } catch (error) {
    console.error("❌ NDVI API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to fetch NDVI data",
      details: error.response?.data || error.message 
    });
  }
});

// 6. Comprehensive farm dashboard for specific polygon
app.get("/api/farm-dashboard/:polygonId", async (req, res) => {
  try {
    const { polygonId } = req.params;
    const apiKey = process.env.AGRO_API_KEY;

    console.log(`🌾 Building farm dashboard for polygon: ${polygonId}`);

    // Get polygon info first
    const polygonUrl = `http://api.agromonitoring.com/agro/1.0/polygons/${polygonId}?appid=${apiKey}`;
    const polygonResponse = await axios.get(polygonUrl);
    const polygon = polygonResponse.data;

    // Get all data in parallel
    const [soilResponse, weatherData, ndviResponse] = await Promise.all([
      // Soil data
      axios.get(`http://api.agromonitoring.com/agro/1.0/soil?polyid=${polygonId}&appid=${apiKey}`),
      // Weather data for polygon center
      axios.get(`http://api.agromonitoring.com/agro/1.0/weather?lat=${polygon.center[1]}&lon=${polygon.center[0]}&appid=${apiKey}`),
      // Recent NDVI data (last 30 days)
      axios.get(`http://api.agromonitoring.com/agro/1.0/ndvi/history?polyid=${polygonId}&start=${Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)}&end=${Math.floor(Date.now() / 1000)}&appid=${apiKey}`)
    ]);

    const soil = soilResponse.data;
    const weather = weatherData.data;
    const ndvi = ndviResponse.data;

    // Build comprehensive dashboard
    const dashboard = {
      farm_info: {
        id: polygon.id,
        name: polygon.name,
        area_hectares: polygon.area ? (polygon.area / 10000).toFixed(2) : "N/A",
        center_coordinates: polygon.center,
        created_at: polygon.created_at
      },
      current_conditions: {
        weather: {
          temperature: kelvinToCelsius(weather.main?.temp || 0),
          feels_like: kelvinToCelsius(weather.main?.feels_like || 0),
          humidity: weather.main?.humidity || 0,
          description: weather.weather?.[0]?.description || "clear sky",
          wind_speed: weather.wind?.speed || 0
        },
        soil: {
          surface_temp: soil.t0 ? kelvinToCelsius(soil.t0) : null,
          soil_temp_10cm: soil.t10 ? kelvinToCelsius(soil.t10) : null,
          moisture: soil.moisture || null,
          last_updated: new Date(soil.dt * 1000).toISOString()
        }
      },
      crop_health: {
        recent_ndvi: ndvi.length > 0 ? {
          latest_value: ndvi[ndvi.length - 1]?.data?.mean || 0,
          date: new Date(ndvi[ndvi.length - 1]?.dt * 1000).toISOString().split('T')[0],
          trend: ndvi.length > 1 ? 
            (ndvi[ndvi.length - 1]?.data?.mean || 0) - (ndvi[ndvi.length - 2]?.data?.mean || 0) : 0,
          total_measurements: ndvi.length
        } : null,
        health_status: ndvi.length > 0 ? 
          (ndvi[ndvi.length - 1]?.data?.mean > 0.6 ? "Excellent" : 
           ndvi[ndvi.length - 1]?.data?.mean > 0.4 ? "Good" : 
           ndvi[ndvi.length - 1]?.data?.mean > 0.2 ? "Fair" : "Poor") : "No data"
      },
      recommendations: {
        irrigation: weather.main?.humidity < 60 ? "Consider irrigation" : "Adequate moisture",
        fertilization: ndvi.length > 0 && ndvi[ndvi.length - 1]?.data?.mean < 0.4 ? 
          "Consider fertilizer application" : "Crop health appears good",
        pest_monitoring: weather.main?.temp > 25 && weather.main?.humidity > 70 ? 
          "High risk conditions for pests" : "Normal monitoring sufficient"
      },
      last_updated: new Date().toISOString()
    };

    console.log("✅ Comprehensive farm dashboard generated");
    res.json({
      success: true,
      dashboard: dashboard
    });

  } catch (error) {
    console.error("❌ Dashboard Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to build farm dashboard",
      details: error.response?.data || error.message 
    });
  }
});

// Health check endpoint (updated to include new endpoints)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    message: "Smart Agriculture Dashboard API with Polygon Support",
    endpoints: {
      existing: [
        "GET /api/weather - Location-based weather",
        "GET /api/forecast - Location-based forecast",
        "GET /api/location - Location name lookup"
      ],
      polygon_new: [
        "POST /api/polygons - Create farm boundary",
        "GET /api/polygons - List all farms",
        "GET /api/soil/:polygonId - Soil data for farm",
        "GET /api/polygon-weather/:polygonId - Weather for farm",
        "GET /api/polygon-ndvi/:polygonId - NDVI data for farm",
        "GET /api/farm-dashboard/:polygonId - Complete farm dashboard"
      ]
    },
    default_location: "Trichy, Tamil Nadu (10.7905, 78.7047)"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Smart Agriculture Dashboard API running on port ${PORT}`);
  console.log(`📍 Weather endpoint: http://localhost:${PORT}/api/weather`);
  console.log(`📊 Forecast endpoint: http://localhost:${PORT}/api/forecast`);
  console.log(`🌍 Location endpoint: http://localhost:${PORT}/api/location`);
  console.log(`🗺️ Polygons: http://localhost:${PORT}/api/polygons`);
  console.log(`🌱 Farm Dashboard: http://localhost:${PORT}/api/farm-dashboard/:polygonId`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌾 Default location: Trichy, Tamil Nadu (10.7905, 78.7047)`);
});
