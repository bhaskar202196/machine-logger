import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import RunLogger from "./pages/RunLogger";
// import Profile from "./pages/Profile"; // ignored as per earlier discussion
import AppLayout from "./layouts/AppLayout";

const userId = sessionStorage.getItem("userId");

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!sessionStorage.getItem("userId")
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!sessionStorage.getItem("userId"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    window.onUserLogin = () => setIsLoggedIn(true);
    window.onUserLogout = () => setIsLoggedIn(false);
    return () => {
      window.onUserLogin = null;
      window.onUserLogout = null;
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public login route */}
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/logger" replace /> : <Login />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            isLoggedIn ? <AppLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route path="logger" element={<RunLogger userId={userId} />} />
          {/* <Route path="profile" element={<Profile />} /> */}

          {/* Redirect "/" to /logger when logged in */}
          <Route index element={<Navigate to="/logger" replace />} />
        </Route>

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
