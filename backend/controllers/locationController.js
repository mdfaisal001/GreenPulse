const { getLocationName } = require("../utils/locationHelper");

const getLocation = async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;

    if (!lat || !lon) return res.status(400).json({ error: "Latitude and longitude required" });

    const locationInfo = await getLocationName(lat, lon);

    res.json({ ...locationInfo, coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) } });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch location" });
  }
};

module.exports = { getLocation };
