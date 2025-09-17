import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

import Home from './components/Home';
import WeatherData from './components/WeatherData';
import FarmSelector from './components/FarmSelector';
import FarmDashboard from './components/FarmDashboard';
import CreateFarm from './components/CreateFarm';

function App() {
  return (
    <Router>
      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 backdrop-blur-lg bg-green-900/30 border-b border-green-700/50 flex justify-center p-4 space-x-4">
        <Link to="/" className="flex items-center space-x-2 px-4 py-2 rounded hover:bg-green-700 transition">
          {/* Logo or icon */}
          <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
          <span>Home</span>
        </Link>
        <Link to="/weather" className="flex items-center space-x-2 px-4 py-2 rounded hover:bg-green-700 transition">
          <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" /></svg>
          <span>Weather</span>
        </Link>
        <Link to="/farms" className="flex items-center space-x-2 px-4 py-2 rounded hover:bg-green-700 transition">
          <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span>Farms</span>
        </Link>
      </nav>

      {/* Routes */}
      <div className="pt-16 min-h-screen px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/weather" element={<WeatherData />} />
          <Route path="/farms" element={<FarmSelector />} />
          <Route path="/create-farm" element={<CreateFarm />} />
          <Route path="/farm/:id" element={<FarmDashboard />} />
          {/* Redirect unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
