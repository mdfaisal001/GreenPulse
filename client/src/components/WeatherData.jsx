import React, { useEffect, useState } from "react";

function WeatherData() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationName, setLocationName] = useState("Current Location");

  // Function to fetch weather data
  const fetchWeatherData = (latitude = 11.0168, longitude = 76.9558) => { // Default to Trichy coordinates
    setLoading(true);
    const weatherUrl = `http://localhost:5000/api/weather?lat=${latitude}&lon=${longitude}`;
    const forecastUrl = `http://localhost:5000/api/forecast?lat=${latitude}&lon=${longitude}`;
    
    Promise.all([
      fetch(weatherUrl).then(res => {
        if (!res.ok) {
          throw new Error(`Weather API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      }),
      fetch(forecastUrl).then(res => {
        if (!res.ok) {
          throw new Error(`Forecast API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
    ])
    .then(([weatherData, forecastData]) => {
      setWeather(weatherData);
      setForecast(forecastData);
      setLoading(false);
      console.log("✅ Weather data loaded for coordinates:", latitude, longitude);
    })
    .catch((err) => {
      console.error("❌ Error fetching weather data:", err);
      setLoading(false);
    });
  };

  // Function to get city name from coordinates  
  const getCityName = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
      const data = await response.json();
      const cityName = data.city || data.locality || data.principalSubdivision || "Current Location";
      setLocationName(cityName);
      console.log("📍 City name found:", cityName);
    } catch (error) {
      console.error("Error getting city name:", error);
      setLocationName("Current Location");
    }
  };

  // Function to get user's current location with better error handling
  const getCurrentLocation = () => {
    setLocationError(null);
    setLoading(true);

    console.log("🌍 Requesting user location...");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      console.error("❌ Geolocation not supported");
      fetchWeatherData(); // Fallback to Trichy
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("✅ User location obtained:", latitude, longitude);
        
        setLocation({ latitude, longitude });
        getCityName(latitude, longitude);
        fetchWeatherData(latitude, longitude);
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        let errorMessage = "";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user. Please enable location in your browser settings.";
            console.error("User denied location permission");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timeout";
            break;
          default:
            errorMessage = "An unknown error occurred";
            break;
        }
        
        setLocationError(errorMessage);
        fetchWeatherData(); // Fallback to Trichy
      },
      options
    );
  };

  const refreshWeather = () => {
    if (location) {
      fetchWeatherData(location.latitude, location.longitude);
    } else {
      getCurrentLocation();
    }
  };

  useEffect(() => {
    // Force location request on component mount
    console.log("🚀 Component mounted, requesting location...");
    getCurrentLocation();

    // Set up interval to refresh every 30 minutes
    const interval = setInterval(refreshWeather, 1800000);
    return () => clearInterval(interval);
  }, []);

  // Helper functions for forecast
  const groupForecastByDays = (forecastList) => {
    if (!forecastList) return [];
    
    const groupedData = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = [];
      }
      groupedData[dateKey].push(item);
    });
    
    // Get daily forecasts (one per day, preferably noon time)
    const dailyForecasts = Object.keys(groupedData).slice(0, 5).map(dateKey => {
      const dayData = groupedData[dateKey];
      
      // Find the forecast closest to noon (12:00)
      const noonForecast = dayData.reduce((prev, current) => {
        const prevHour = new Date(prev.dt * 1000).getHours();
        const currentHour = new Date(current.dt * 1000).getHours();
        
        return Math.abs(currentHour - 12) < Math.abs(prevHour - 12) ? current : prev;
      });
      
      // Calculate daily min/max from all forecasts of that day
      const temps = dayData.map(item => item.main.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      
      return {
        ...noonForecast,
        main: {
          ...noonForecast.main,
          temp_min: minTemp,
          temp_max: maxTemp
        }
      };
    });
    
    return dailyForecasts;
  };

  const formatDay = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-300 text-lg font-medium">
            {location ? "Loading agricultural weather data..." : "Getting your farm location..."}
          </p>
          <p className="text-green-500 text-sm mt-2">🌾 Smart Agriculture Weather System</p>
          {locationError && (
            <p className="text-orange-300 text-sm mt-2 max-w-md">{locationError}</p>
          )}
        </div>
      </div>
    );
  }

  if (!weather || !forecast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-800 flex items-center justify-center">
        <div className="text-center bg-slate-800/80 p-8 rounded-2xl shadow-2xl border border-green-700/30 max-w-md">
          <div className="text-red-400 text-6xl mb-4">🌾❌</div>
          <p className="text-red-300 text-lg font-medium">Failed to load agricultural weather data</p>
          {locationError && (
            <p className="text-orange-300 text-sm mb-4 mt-2">{locationError}</p>
          )}
          <button 
            onClick={refreshWeather}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl transition-colors shadow-lg"
          >
            🔄 Try Again
          </button>
          <button 
            onClick={getCurrentLocation}
            className="mt-2 block mx-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
          >
            📍 Request Location Permission
          </button>
        </div>
      </div>
    );
  }

  // Safe access to weather data
  const temp = Math.round(weather?.main?.temp ?? 0);
  const feelsLike = Math.round(weather?.main?.feels_like ?? 0);
  const min = Math.round(weather?.main?.temp_min ?? 0);
  const max = Math.round(weather?.main?.temp_max ?? 0);
  const humidity = weather?.main?.humidity ?? 0;
  const windSpeed = weather?.wind?.speed ?? 0;
  const windDeg = weather?.wind?.deg ?? 0;
  const clouds = weather?.clouds?.all ?? 0;
  const weatherDesc = weather?.weather?.[0]?.description ?? "clear sky";
  const weatherIcon = weather?.weather?.[0]?.icon;
  const currentTime = formatTime(Date.now() / 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-800 text-white">
      {/* Main Weather Display */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">🌾</div>
          <div className="absolute top-32 right-16 text-4xl animate-pulse">🌱</div>
          <div className="absolute bottom-20 left-1/4 text-5xl animate-bounce">🚜</div>
          <div className="absolute bottom-32 right-1/3 text-3xl animate-pulse">🌿</div>
        </div>

        <div className="relative z-10 p-8">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🌾</span>
              <h1 className="text-2xl font-bold text-green-300">Smart Agriculture Dashboard</h1>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={getCurrentLocation}
                className="bg-green-700/50 hover:bg-green-600/50 backdrop-blur-sm border border-green-500/30 text-green-200 px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2"
                title="Get current location weather"
              >
                <span>📍</span>
                <span>My Farm</span>
              </button>
              <button 
                onClick={refreshWeather}
                className="bg-blue-700/50 hover:bg-blue-600/50 backdrop-blur-sm border border-blue-500/30 text-blue-200 px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Location Status */}
          {locationError && (
            <div className="bg-orange-900/50 border-l-4 border-orange-500 text-orange-200 p-4 rounded mb-6 backdrop-blur-sm">
              <p className="font-bold">Location Notice:</p>
              <p>{locationError}</p>
              <button 
                onClick={getCurrentLocation}
                className="mt-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors text-sm"
              >
                📍 Try Location Again
              </button>
            </div>
          )}

          {/* Current Weather Hero Section */}
          <div className="bg-gradient-to-r from-slate-800/80 to-green-800/60 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-green-700/30 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                {weatherIcon && (
                  <img
                    src={`https://openweathermap.org/img/wn/${weatherIcon}@4x.png`}
                    alt="Weather"
                    className="w-24 h-24 drop-shadow-lg"
                  />
                )}
              </div>
              <div className="text-right">
                <div className="text-6xl font-bold text-green-100 mb-2">{temp}°</div>
                <div className="text-green-300 text-sm">FC</div>
                <div className="text-green-400 text-sm mt-1">{max}° {min}°</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-green-200 capitalize">{weatherDesc}</h2>
                <div className="flex items-center space-x-2 text-green-300 mt-1">
                  <span>Feels like {feelsLike}°</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-green-700/30 pt-6">
              <div className="flex items-center justify-between text-green-300">
                <div>
                  <span className="text-lg font-medium">{locationName}</span>
                  {location && (
                    <p className="text-sm text-green-400">
                      📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
                <span className="text-sm">{currentTime}</span>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-green-700/30 shadow-xl mb-8">
            <h3 className="text-green-300 text-lg font-semibold mb-4 flex items-center space-x-2">
              <span>📅</span>
              <span>5-Day Agricultural Forecast</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {groupForecastByDays(forecast?.list)?.map((item, index) => {
                const dayTemp = Math.round(item.main.temp);
                const minTemp = Math.round(item.main.temp_min);
                const maxTemp = Math.round(item.main.temp_max);
                const humidity = item.main.humidity;
                
                return (
                  <div key={index} className="text-center p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-green-800/20">
                    <div className="text-green-300 text-sm font-medium mb-2">
                      {formatDay(item.dt)}
                    </div>
                    <div className="mb-3">
                      {item.weather?.[0]?.icon && (
                        <img
                          src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                          alt={item.weather[0].description}
                          className="w-12 h-12 mx-auto drop-shadow-md"
                          title={item.weather[0].description}
                        />
                      )}
                    </div>
                    <div className="text-white font-bold text-lg">{maxTemp}°</div>
                    <div className="text-green-400 text-sm">{minTemp}°</div>
                    <div className="text-blue-400 text-xs mt-1">💧 {humidity}%</div>
                    {item.rain && (
                      <div className="text-blue-300 text-xs">🌧️ {item.rain["3h"] || 0}mm</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agricultural Weather Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-blue-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-300 text-sm">Humidity</span>
                <span className="text-2xl">💧</span>
              </div>
              <div className="text-white text-2xl font-bold">{humidity}%</div>
              <div className="text-blue-400 text-xs mt-1">Crop Irrigation</div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-green-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-300 text-sm">Wind</span>
                <span className="text-2xl">🌬️</span>
              </div>
              <div className="text-white text-2xl font-bold">{windSpeed.toFixed(1)} m/s</div>
              <div className="text-green-400 text-xs mt-1">Dir: {windDeg}° • Spray Safe</div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-yellow-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-300 text-sm">Feels Like</span>
                <span className="text-2xl">🌡️</span>
              </div>
              <div className="text-white text-2xl font-bold">{feelsLike}°</div>
              <div className="text-yellow-400 text-xs mt-1">Field Work Index</div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-300 text-sm">Cloud Cover</span>
                <span className="text-2xl">☁️</span>
              </div>
              <div className="text-white text-2xl font-bold">{clouds}%</div>
              <div className="text-purple-400 text-xs mt-1">Sky Coverage</div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-green-500/70">
            <p className="flex items-center justify-center space-x-2 text-sm">
              <span>🌾</span>
              <span>Powered by AgroMonitoring Agricultural Weather API</span>
              <span>🚜</span>
            </p>
            <p className="text-xs mt-1">
              Data updates every 1-2 hours • Dashboard auto-refreshes every 30 minutes
              {location && " • Using your GPS location"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherData;
