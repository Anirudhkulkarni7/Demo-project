// App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import NavBar from './components/NavBar';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // On mount, check localStorage to see if user was previously logged in
  useEffect(() => {
    const storedStatus = localStorage.getItem('isLoggedIn');
    if (storedStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
     setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
     setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    navigate('/', { replace: true });
  };

  return (
    <>
      {isLoggedIn && <NavBar onLogout={handleLogout} />}

      <Routes>
         <Route
          path="/"
          element={
            isLoggedIn
              ? <Navigate to="/user" replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />

         <Route
          path="/user"
          element={
            isLoggedIn ? <UserDashboard /> : <Navigate to="/" replace />
          }
        />

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
