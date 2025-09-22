import React, { useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxcxufsofVM8T-OW64K7PAjTLo0WS6o7TYI_84HVaT-rnN3mH3izQRkNP592mvtz84/exec";

function Login({ onLogin }) {
  const [userId, setUserId] = useState(""); // ✅ use camelCase consistently
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // ✅ required for Apps Script
        body: JSON.stringify({ action: "login", userId, password }), // ✅ fixed key
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        if (onLogin) onLogin(userId); // ✅ send logged-in email back to App.js
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch {
      setError("Network or server error.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white p-8 rounded-2xl shadow-xl w-80"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg focus:outline-none"
            required
            autoComplete="username"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg focus:outline-none"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="mb-2 text-sm text-red-600 text-center">{error}</div>
        )}
        {success && (
          <div className="mb-2 text-sm text-green-600 text-center">
            Login successful!
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;
