import React, { useState, useEffect } from 'react';

function CreateFarm({ onFarmCreated, onCancel }) {
  const [farmName, setFarmName] = useState('');
  const [coordinates, setCoordinates] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [manualInput, setManualInput] = useState({ lat: '', lon: '' });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lon: longitude });
        },
        (error) => {
          console.log('Location access denied, you can add coordinates manually');
        }
      );
    }
  }, []);

  const addCurrentLocation = () => {
    if (currentLocation) {
      const newCoord = [currentLocation.lon, currentLocation.lat];
      setCoordinates([...coordinates, newCoord]);
    }
  };

  const addManualCoordinate = () => {
    const lat = parseFloat(manualInput.lat);
    const lon = parseFloat(manualInput.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid numbers for latitude and longitude');
      return;
    }
    
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('Please enter valid coordinates (Lat: -90 to 90, Lon: -180 to 180)');
      return;
    }
    
    const newCoord = [lon, lat];
    setCoordinates([...coordinates, newCoord]);
    setManualInput({ lat: '', lon: '' });
  };

  const removeCoordinate = (index) => {
    setCoordinates(coordinates.filter((_, i) => i !== index));
  };

  const clearAllPoints = () => {
    setCoordinates([]);
  };

  const openGoogleMaps = () => {
    const baseUrl = currentLocation 
      ? `https://www.google.com/maps/@${currentLocation.lat},${currentLocation.lon},15z`
      : 'https://www.google.com/maps';
    window.open(baseUrl, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!farmName.trim()) {
      setError('Please enter a farm name');
      return;
    }

    if (coordinates.length < 3) {
      setError('Please add at least 3 coordinate points to create a farm boundary');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      // Create GeoJSON polygon
      const geoJson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [...coordinates, coordinates[0]] // Close the polygon
          ]
        }
      };

      const response = await fetch('http://localhost:5000/api/polygons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: farmName,
          geo_json: geoJson
        })
      });

      const data = await response.json();

      if (data.success) {
        onFarmCreated(data.polygon);
      } else {
        throw new Error(data.error || 'Failed to create farm');
      }
    } catch (error) {
      console.error('Farm creation error:', error);
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🌾 Create New Farm</h1>
          <p className="text-green-300 text-lg">Define your farm boundary using GPS coordinates</p>
        </div>

        {/* Main Form */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-green-700/30">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Farm Name */}
            <div>
              <label className="block text-green-300 text-sm font-medium mb-3">
                Farm Name *
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Enter your farm name (e.g., North Rice Field, Cotton Plot 1)"
                className="w-full bg-slate-700/50 border border-green-700/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Current Location & Tools */}
              <div className="space-y-6">
                {/* Current Location Section */}
                {currentLocation && (
                  <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-700/50">
                    <h3 className="text-blue-300 font-semibold mb-4 flex items-center space-x-2">
                      <span>📍</span>
                      <span>Your Current Location</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-blue-200 text-sm mb-2">GPS Coordinates:</p>
                        <p className="text-white font-mono text-sm bg-slate-700/30 p-3 rounded-lg">
                          Lat: {currentLocation.lat.toFixed(6)}<br/>
                          Lon: {currentLocation.lon.toFixed(6)}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          type="button"
                          onClick={addCurrentLocation}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <span>📍</span>
                          <span>Add Current Location</span>
                        </button>
                        <button
                          type="button"
                          onClick={openGoogleMaps}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <span>🗺️</span>
                          <span>Open Google Maps</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Coordinate Input */}
                <div className="bg-slate-700/30 rounded-xl p-6">
                  <h3 className="text-green-300 font-semibold mb-4 flex items-center space-x-2">
                    <span>🎯</span>
                    <span>Add Boundary Points</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-green-300 text-xs mb-2">Latitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={manualInput.lat}
                          onChange={(e) => setManualInput(prev => ({...prev, lat: e.target.value}))}
                          placeholder="10.790500"
                          className="w-full bg-slate-700/50 border border-green-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-green-300 text-xs mb-2">Longitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={manualInput.lon}
                          onChange={(e) => setManualInput(prev => ({...prev, lon: e.target.value}))}
                          placeholder="78.704700"
                          className="w-full bg-slate-700/50 border border-green-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addManualCoordinate}
                      disabled={!manualInput.lat || !manualInput.lon}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>➕</span>
                      <span>Add Point</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Boundary Points List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-green-300 font-semibold">
                    Farm Boundary Points ({coordinates.length})
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="text-green-400 text-sm">
                      {coordinates.length >= 3 ? '✅ Ready to create' : `${3 - coordinates.length} more needed`}
                    </div>
                    {coordinates.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllPoints}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {coordinates.length > 0 ? (
                  <div className="bg-slate-700/30 rounded-xl p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-2">
                      {coordinates.map((coord, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-600/30 rounded-lg p-3">
                          <div className="flex-1">
                            <span className="text-white font-semibold text-sm">
                              📍 Point {index + 1}
                            </span>
                            <br />
                            <span className="text-green-300 text-xs font-mono">
                              Lat: {coord[1].toFixed(6)}, Lon: {coord[0].toFixed(6)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCoordinate(index)}
                            className="text-red-400 hover:text-red-300 transition-colors ml-2 px-2"
                            title="Remove point"
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 bg-slate-700/20 rounded-xl">
                    <div className="text-6xl mb-4">🌾</div>
                    <p className="text-lg mb-2">No boundary points added yet</p>
                    <p className="text-sm">
                      Add your current location or enter coordinates manually
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-green-900/30 rounded-xl p-6 border border-green-700/50">
              <h3 className="text-green-300 font-semibold mb-3">🗺️ How to Find Your Farm Coordinates:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-800/20 rounded-lg p-4">
                  <h4 className="text-blue-300 font-semibold mb-2">📱 Current Location</h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Visit your farm with GPS enabled</li>
                    <li>• Click "Add Current Location" at each corner</li>
                    <li>• Most accurate method</li>
                  </ul>
                </div>
                <div className="bg-green-800/20 rounded-lg p-4">
                  <h4 className="text-green-300 font-semibold mb-2">🗺️ Google Maps</h4>
                  <ul className="text-green-200 text-sm space-y-1">
                    <li>• Right-click on farm corners</li>
                    <li>• Copy coordinates from popup</li>
                    <li>• Enter manually here</li>
                  </ul>
                </div>
                <div className="bg-purple-800/20 rounded-lg p-4">
                  <h4 className="text-purple-300 font-semibold mb-2">📏 Requirements</h4>
                  <ul className="text-purple-200 text-sm space-y-1">
                    <li>• Minimum 3 corner points</li>
                    <li>• Add points in clockwise order</li>
                    <li>• More points = better accuracy</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/50 border border-red-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-red-400 text-xl">⚠️</span>
                  <span className="text-red-300">{error}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-green-700/30">
              <button
                type="button"
                onClick={onCancel}
                className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-3 rounded-xl transition-colors"
              >
                ← Cancel
              </button>
              
              <button
                type="submit"
                disabled={creating || !farmName.trim() || coordinates.length < 3}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl transition-colors flex items-center space-x-3"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Farm...</span>
                  </>
                ) : (
                  <>
                    <span>🌾</span>
                    <span>Create Farm ({coordinates.length} points)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sample Coordinates Helper */}
        <div className="mt-6 bg-yellow-900/30 rounded-xl p-4 border border-yellow-700/50">
          <h3 className="text-yellow-300 font-semibold mb-2">💡 Sample Farm Coordinates (Trichy Area):</h3>
          <div className="text-yellow-200 text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
            <p><strong>Point 1:</strong> Lat: 10.791000, Lon: 78.704000 (Northwest corner)</p>
            <p><strong>Point 2:</strong> Lat: 10.790000, Lon: 78.705000 (Northeast corner)</p>
            <p><strong>Point 3:</strong> Lat: 10.789000, Lon: 78.704500 (Southeast corner)</p>
            <p><strong>Point 4:</strong> Lat: 10.790500, Lon: 78.703500 (Southwest corner)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateFarm;
