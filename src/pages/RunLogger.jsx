import React, { useEffect, useState } from "react";

// === CONFIG: Your deployed Apps Script Web App URL ===
const API_URL =
  "https://script.google.com/macros/s/AKfycbxcxufsofVM8T-OW64K7PAjTLo0WS6o7TYI_84HVaT-rnN3mH3izQRkNP592mvtz84/exec";

function RunLogger({ userId }) {
  const [machines, setMachines] = useState([]);
  const [selected, setSelected] = useState("");
  const [startDisabled, setStartDisabled] = useState(false);
  const [stopDisabled, setStopDisabled] = useState(true);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(false);

  // Show toast helper
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  // Fetch machine list for the logged-in user
  useEffect(() => {
    if (!userId) return;

    setLoadingMachines(true);
    const url = `${API_URL}?action=machines&email=${encodeURIComponent(
      userId
    )}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log("Machines fetched:", data); // ✅ Debug log
        if (Array.isArray(data)) {
          setMachines(data);
        } else {
          showToast("⚠️ Could not load machines");
        }
      })
      .catch(() => showToast("⚠️ Error loading machine list"))
      .finally(() => setLoadingMachines(false));
  }, [userId]);

  // Start machine
  const handleStart = async () => {
    if (!selected) {
      showToast("⚠️ Select a machine first");
      return;
    }
    setStartDisabled(true);
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "start", machine: selected, userId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ Machine Started");
        setStopDisabled(false);
      } else {
        showToast("❌ " + (data.message || "Failed to start"));
        setStartDisabled(false);
      }
    } catch {
      showToast("❌ Backend error");
      setStartDisabled(false);
    }
    setLoading(false);
  };

  // Stop machine
  const handleStop = async () => {
    if (!selected) {
      showToast("⚠️ Select a machine first");
      return;
    }
    setStopDisabled(true);
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "stop", machine: selected, userId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("🛑 Machine Stopped");
        setStartDisabled(false);
      } else {
        showToast("❌ " + (data.message || "Failed to stop"));
        setStopDisabled(false);
      }
    } catch {
      showToast("❌ Backend error");
      setStopDisabled(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Machine Logger</h2>

        <select
          className="w-full border px-3 py-2 rounded-lg mb-4"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={loading || loadingMachines}
        >
          <option value="">-- Select Machine --</option>
          {loadingMachines && <option disabled>⏳ Loading...</option>}
          {!loadingMachines && machines.length === 0 && (
            <option disabled>⚠️ No machines available</option>
          )}
          {machines.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <div className="flex justify-center space-x-4">
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            onClick={handleStart}
            disabled={startDisabled || loading}
          >
            {loading && startDisabled ? "Starting..." : "Start"}
          </button>
          <button
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            onClick={handleStop}
            disabled={stopDisabled || loading}
          >
            {loading && stopDisabled ? "Stopping..." : "Stop"}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed left-1/2 bottom-8 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded shadow z-50 animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
}

export default RunLogger;
