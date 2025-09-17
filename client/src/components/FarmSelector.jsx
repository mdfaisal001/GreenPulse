import React, { useState, useEffect } from 'react';

function FarmSelector({ onFarmSelect, onCreateFarm }) {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/polygons');
      const data = await response.json();
      
      if (data.success) {
        setFarms(data.polygons);
      } else {
        throw new Error(data.error || 'Failed to fetch farms');
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
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
          <p className="text-green-300 text-lg font-medium">Loading your farms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center bg-slate-800/80 p-8 rounded-2xl border border-red-700/30">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Farms</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <button 
            onClick={fetchFarms}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">My Farms</h1>
          <p className="text-green-300 text-lg">
            Select a farm to monitor soil, weather, and crop health
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-green-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Total Farms</p>
                <p className="text-white text-3xl font-bold">{farms.length}</p>
              </div>
              <div className="text-4xl">🏞️</div>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Area</p>
                <p className="text-white text-3xl font-bold">
                  {farms.reduce((sum, farm) => sum + parseFloat(farm.area_hectares || 0), 0).toFixed(1)} ha
                </p>
              </div>
              <div className="text-4xl">📏</div>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Monitoring</p>
                <p className="text-white text-3xl font-bold">Active</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Add Farm Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={onCreateFarm}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg flex items-center space-x-3 text-lg"
          >
            <span className="text-2xl">➕</span>
            <span>Add New Farm</span>
          </button>
        </div>

        {/* Farms Grid */}
        {farms.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🌱</div>
            <h3 className="text-2xl font-bold text-white mb-4">No farms added yet</h3>
            <p className="text-green-300 mb-8">Create your first farm to start precision monitoring</p>
            <button
              onClick={onCreateFarm}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              Create Your First Farm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <div
                key={farm.id}
                onClick={() => onFarmSelect(farm)}
                className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-green-700/30 hover:border-green-500/50 cursor-pointer transition-all duration-200 hover:scale-105 shadow-xl"
              >
                {/* Farm Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white truncate">{farm.name}</h3>
                  <div className="text-2xl">🏞️</div>
                </div>

                {/* Farm Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-green-300 text-sm">Area</span>
                    <span className="text-white font-semibold">{farm.area_hectares} hectares</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-blue-300 text-sm">Location</span>
                    <span className="text-white font-semibold text-xs">
                      {farm.center ? 
                        `${farm.center[1].toFixed(4)}, ${farm.center[0].toFixed(4)}` : 
                        'Coordinates unavailable'
                      }
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-purple-300 text-sm">Status</span>
                    <span className="text-green-400 font-semibold">Active</span>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-300 py-3 rounded-lg transition-colors border border-green-600/30">
                  Monitor Farm →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmSelector;
