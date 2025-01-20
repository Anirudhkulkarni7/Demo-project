// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import NavBar from './components/NavBar';

function App() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  // Load role from localStorage on mount
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  const handleLogin = (userRole) => {
    setRole(userRole);
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('userRole');
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* Render NavBar only when a user is logged in */}
      {role && <NavBar onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/user" element={<UserDashboard />} />
        {/* Fallback route */}
        <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
      </Routes>
    </>
  );
}

export default function WrappedApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
