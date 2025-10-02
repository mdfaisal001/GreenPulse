const axios = require("axios");

const getLocationName = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${process.env.OPENCAGE_API_KEY}&limit=1&no_annotations=1`
    );

    const comp = response.data.results[0].components;

    const village = comp.village || comp.hamlet || "";
    const majorCity = comp.city || comp.town || comp.county || "Current Location";
    const state = comp.state || "";
    const country = comp.country || "India";

    // Append major city (like Trichy) after village
    const fullName = village ? `${village}, ${majorCity}${state ? ", " + state : ""}` : `${majorCity}${state ? ", " + state : ""}`;

    return { name: village || majorCity, state, country, fullName };
  } catch (error) {
    console.error("Location fetch error:", error.message);
    return { name: "Current Location", state: "", country: "India", fullName: "Current Location" };
  }
};

module.exports = { getLocationName };
