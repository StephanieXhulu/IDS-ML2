import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import NetworkDashboard from './components/NetworkDashboard';
import PDMSDashboard from './components/PDMSDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/network" element={<NetworkDashboard />} />
        <Route path="/pdms" element={<PDMSDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
