import React, { useState, useEffect } from 'react';

function FarmWeather({ farm }) {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (farm?.id) {
      fetchFarmWeather();
    }
  }, [farm?.id]);

  const fetchFarmWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both current weather and forecast for the farm
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/polygon-weather/${farm.id}`),
        // For forecast, we'll use coordinates from the farm center
        fetch(`http://localhost:5000/api/forecast?lat=${farm.center[1]}&lon=${farm.center[0]}`)
      ]);

      const weatherData = await weatherResponse.json();
      const forecastData = await forecastResponse.json();

      if (weatherData.success) {
        setWeatherData(weatherData.weather_data);
      } else {
        throw new Error(weatherData.error || 'Failed to fetch weather data');
      }

      // Forecast data might have different structure
      if (forecastData.list) {
        setForecastData(forecastData);
      }

    } catch (error) {
      console.error('Farm weather error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
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

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-300 text-lg font-medium">Loading farm weather...</p>
          <p className="text-green-500 text-sm mt-2">🌾 {farm.name}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center bg-slate-800/80 p-8 rounded-2xl border border-red-700/30">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Farm Weather</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <button 
            onClick={fetchFarmWeather}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🌤️</div>
        <h3 className="text-xl font-bold text-white mb-4">No Weather Data Available</h3>
        <p className="text-gray-300">Weather information for this farm is currently unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Farm Weather Header */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-green-700/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
              <span className="text-4xl">🌤️</span>
              <span>Weather for {weatherData.polygon_name}</span>
            </h2>
            <p className="text-green-300 mt-2">
              Area: {weatherData.area_hectares} hectares • 
              Location: {weatherData.coordinates.lat.toFixed(4)}, {weatherData.coordinates.lon.toFixed(4)}
            </p>
          </div>
          <button 
            onClick={fetchFarmWeather}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Current Weather Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Temperature */}
          <div className="text-center bg-blue-900/30 rounded-xl p-6 border border-blue-700/50">
            <div className="text-6xl mb-4">🌡️</div>
            <div className="text-white text-3xl font-bold mb-2">
              {weatherData.weather.temp}°C
            </div>
            <div className="text-blue-300 text-sm">
              Feels like {weatherData.weather.feels_like}°C
            </div>
            <div className="text-blue-400 text-xs mt-1">
              Min {weatherData.weather.temp_min}° • Max {weatherData.weather.temp_max}°
            </div>
          </div>

          {/* Humidity */}
          <div className="text-center bg-green-900/30 rounded-xl p-6 border border-green-700/50">
            <div className="text-6xl mb-4">💧</div>
            <div className="text-white text-3xl font-bold mb-2">
              {weatherData.weather.humidity}%
            </div>
            <div className="text-green-300 text-sm">Humidity</div>
            <div className="text-green-400 text-xs mt-1">
              {weatherData.weather.humidity > 70 ? 'High moisture' : 
               weatherData.weather.humidity > 40 ? 'Moderate' : 'Low moisture'}
            </div>
          </div>

          {/* Wind */}
          <div className="text-center bg-purple-900/30 rounded-xl p-6 border border-purple-700/50">
            <div className="text-6xl mb-4">💨</div>
            <div className="text-white text-3xl font-bold mb-2">
              {weatherData.wind.speed.toFixed(1)} m/s
            </div>
            <div className="text-purple-300 text-sm">Wind Speed</div>
            <div className="text-purple-400 text-xs mt-1">
              Direction: {weatherData.wind.deg}°
            </div>
          </div>

          {/* Conditions */}
          <div className="text-center bg-yellow-900/30 rounded-xl p-6 border border-yellow-700/50">
            <div className="text-6xl mb-4">
              <img
                src={`https://openweathermap.org/img/wn/${weatherData.weather.icon}@2x.png`}
                alt="Weather"
                className="w-16 h-16 mx-auto"
              />
            </div>
            <div className="text-white text-xl font-bold mb-2 capitalize">
              {weatherData.weather.description}
            </div>
            <div className="text-yellow-300 text-sm">Current Conditions</div>
          </div>
        </div>

        {/* Agricultural Insights */}
        <div className="mt-8 bg-slate-700/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <span>🌾</span>
            <span>Agricultural Insights</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-800/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">💧 Irrigation</h4>
              <p className="text-white">
                {weatherData.weather.humidity < 60 ? 
                  "Consider irrigation - low humidity detected" : 
                  "Adequate moisture levels for most crops"}
              </p>
            </div>
            <div className="bg-green-800/30 rounded-lg p-4">
              <h4 className="text-green-300 font-semibold mb-2">🚜 Field Work</h4>
              <p className="text-white">
                {weatherData.wind.speed > 5 ? 
                  "Avoid spraying - high wind conditions" : 
                  "Good conditions for field operations"}
              </p>
            </div>
            <div className="bg-yellow-800/30 rounded-lg p-4">
              <h4 className="text-yellow-300 font-semibold mb-2">🌡️ Temperature</h4>
              <p className="text-white">
                {weatherData.weather.temp > 35 ? 
                  "High stress conditions for crops" : 
                  weatherData.weather.temp < 10 ? 
                  "Cold stress risk for sensitive crops" : 
                  "Favorable temperature range"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      {forecastData && (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-green-700/30">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <span className="text-3xl">📅</span>
            <span>5-Day Farm Forecast</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {groupForecastByDays(forecastData.list)?.map((item, index) => (
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
                <div className="text-white font-bold text-lg">{Math.round(item.main.temp_max)}°</div>
                <div className="text-green-400 text-sm">{Math.round(item.main.temp_min)}°</div>
                <div className="text-blue-400 text-xs mt-1">💧 {item.main.humidity}%</div>
                {item.rain && (
                  <div className="text-blue-300 text-xs">🌧️ {item.rain["3h"] || 0}mm</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sun Times */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-yellow-700/30">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <span>☀️</span>
          <span>Sun Times</span>
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🌅</div>
            <div className="text-white text-xl font-bold">
              {formatTime(weatherData.sun.sunrise)}
            </div>
            <div className="text-yellow-300 text-sm">Sunrise</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🌇</div>
            <div className="text-white text-xl font-bold">
              {formatTime(weatherData.sun.sunset)}
            </div>
            <div className="text-orange-300 text-sm">Sunset</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-green-500/70">
        <p className="text-sm">
          🌾 Farm-specific weather data • Last updated: {formatTime(weatherData.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default FarmWeather;
