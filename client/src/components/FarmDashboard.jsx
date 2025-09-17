import React, { useState, useEffect } from 'react';

function FarmDashboard({ farm, onBack }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'weather', 'soil', 'ndvi'

  useEffect(() => {
    if (farm?.id) {
      fetchDashboardData();
    }
  }, [farm?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/farm-dashboard/${farm.id}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.dashboard);
      } else {
        throw new Error(data.error || 'Failed to fetch farm data');
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-300 text-lg font-medium">Loading farm dashboard...</p>
          <p className="text-green-500 text-sm mt-2">🌾 Analyzing {farm.name}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center bg-slate-800/80 p-8 rounded-2xl border border-red-700/30">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Farm Data</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={fetchDashboardData}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              🔄 Try Again
            </button>
            <button 
              onClick={onBack}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              ← Back to Farms
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="bg-slate-700/50 hover:bg-slate-600/50 text-white p-3 rounded-xl transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center space-x-3">
                <span className="text-5xl">🌾</span>
                <span>{dashboardData?.farm_info.name}</span>
              </h1>
              <p className="text-green-300 mt-1">
                Farm Dashboard • {dashboardData?.farm_info.area_hectares} hectares
              </p>
            </div>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-2 border border-green-700/30 mb-8">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Overview', icon: '🏠' },
              { id: 'weather', label: 'Weather', icon: '🌤️' },
              { id: 'soil', label: 'Soil', icon: '🌱' },
              { id: 'ndvi', label: 'Crop Health', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-green-300 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-700/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-blue-300 text-sm font-medium">Temperature</span>
                  <span className="text-3xl">🌡️</span>
                </div>
                <div className="text-white text-3xl font-bold mb-2">
                  {dashboardData?.current_conditions.weather.temperature}°C
                </div>
                <div className="text-blue-400 text-sm">
                  Feels like {dashboardData?.current_conditions.weather.feels_like}°C
                </div>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-green-700/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-green-300 text-sm font-medium">Soil Temp</span>
                  <span className="text-3xl">🌱</span>
                </div>
                <div className="text-white text-3xl font-bold mb-2">
                  {dashboardData?.current_conditions.soil.surface_temp || '--'}°C
                </div>
                <div className="text-green-400 text-sm">Surface level</div>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-purple-300 text-sm font-medium">Crop Health</span>
                  <span className="text-3xl">📊</span>
                </div>
                <div className="text-white text-3xl font-bold mb-2">
                  {dashboardData?.crop_health.health_status}
                </div>
                <div className="text-purple-400 text-sm">
                  NDVI: {dashboardData?.crop_health.recent_ndvi?.latest_value?.toFixed(3) || 'No data'}
                </div>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-yellow-700/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-yellow-300 text-sm font-medium">Humidity</span>
                  <span className="text-3xl">💧</span>
                </div>
                <div className="text-white text-3xl font-bold mb-2">
                  {dashboardData?.current_conditions.weather.humidity}%
                </div>
                <div className="text-yellow-400 text-sm">Air moisture</div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-green-700/30">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                <span className="text-3xl">💡</span>
                <span>Farm Recommendations</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-700/50">
                  <h3 className="text-blue-300 font-semibold mb-3">💧 Irrigation</h3>
                  <p className="text-white">{dashboardData?.recommendations.irrigation}</p>
                </div>

                <div className="bg-green-900/30 rounded-xl p-6 border border-green-700/50">
                  <h3 className="text-green-300 font-semibold mb-3">🌱 Fertilization</h3>
                  <p className="text-white">{dashboardData?.recommendations.fertilization}</p>
                </div>

                <div className="bg-yellow-900/30 rounded-xl p-6 border border-yellow-700/50">
                  <h3 className="text-yellow-300 font-semibold mb-3">🐛 Pest Control</h3>
                  <p className="text-white">{dashboardData?.recommendations.pest_monitoring}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content will be similar, simplified for brevity */}
        {activeTab === 'weather' && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-green-700/30">
            <h2 className="text-2xl font-bold text-white mb-6">🌤️ Weather Conditions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🌡️</div>
                <div className="text-white text-2xl font-bold mb-2">
                  {dashboardData?.current_conditions.weather.temperature}°C
                </div>
                <div className="text-gray-300">Temperature</div>
              </div>
              <div className="text-center">
                <div className="text-6xl mb-4">💨</div>
                <div className="text-white text-2xl font-bold mb-2">
                  {dashboardData?.current_conditions.weather.wind_speed} m/s
                </div>
                <div className="text-gray-300">Wind Speed</div>
              </div>
              <div className="text-center">
                <div className="text-6xl mb-4">💧</div>
                <div className="text-white text-2xl font-bold mb-2">
                  {dashboardData?.current_conditions.weather.humidity}%
                </div>
                <div className="text-gray-300">Humidity</div>
              </div>
              <div className="text-center">
                <div className="text-6xl mb-4">☁️</div>
                <div className="text-white text-2xl font-bold mb-2 capitalize">
                  {dashboardData?.current_conditions.weather.description}
                </div>
                <div className="text-gray-300">Conditions</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmDashboard;
