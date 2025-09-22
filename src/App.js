import React, { useState } from "react";
import Login from "./pages/Login";
import RunLogger from "./pages/RunLogger";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");

  const handleLogin = (email) => {
    setUserId(email); // ✅ save logged-in email
    setLoggedIn(true);
  };

  return (
    <>
      {loggedIn ? (
        <RunLogger userId={userId} /> // ✅ pass email
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
