// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import NavBar from './components/NavBar'; // optional if you have a NavBar

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  // On mount, check localStorage to see if user was previously logged in
  useEffect(() => {
    const storedStatus = localStorage.getItem('isLoggedIn');
    const storedRole = localStorage.getItem('role');
    if (storedStatus === 'true' && storedRole) {
      setIsLoggedIn(true);
      setRole(storedRole);
    }
  }, []);

  // Called by LoginPage upon successful login
  const handleLogin = (userRole) => {
    setIsLoggedIn(true);
    setRole(userRole);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('role', userRole);
  };

  // Called by NavBar (or anywhere) to log out
  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* If you have a NavBar, pass the role & logout handler */}
      {isLoggedIn && <NavBar onLogout={handleLogout} role={role} />}

      <Routes>
        {/* Root path: if logged in, go to /user; else show login */}
        <Route
          path="/"
          element={
            isLoggedIn
              ? <Navigate to="/user" replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* User Dashboard: if not logged in, redirect to login */}
        <Route
          path="/user"
          element={
            isLoggedIn
              ? <UserDashboard role={role} />
              : <Navigate to="/" replace />
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
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
