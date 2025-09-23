// src/pages/RunLogger.jsx
import React, { useEffect, useState, useCallback } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxcxufsofVM8T-OW64K7PAjTLo0WS6o7TYI_84HVaT-rnN3mH3izQRkNP592mvtz84/exec";

function RunLogger({ userId }) {
  console.log("[RunLogger] userId received from App.js:", userId);
  const [machines, setMachines] = useState([]);
  const [selected, setSelected] = useState("");
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDisabled, setStartDisabled] = useState(false);
  const [stopDisabled, setStopDisabled] = useState(true);
  const [toast, setToast] = useState("");

  const [useCustomEnd, setUseCustomEnd] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const [runInfo, setRunInfo] = useState(null);

  // ✅ Memoized toast function
  const showToast = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 3000);
  }, []);

  const formatDuration = (durationStr) => {
    if (!durationStr) return "";

    const match = parseFloat(durationStr);
    if (isNaN(match)) return durationStr;

    const totalSeconds = Math.round(match * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    if (mins === 0) return `${secs} sec`;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} sec`;
  };

  // ✅ Only fetch when userId is available
  // ✅ correct
  useEffect(() => {
    console.log(
      "[RunLogger] Fetch useEffect triggered. Current userId:",
      userId
    );

    if (!userId) {
      console.warn("⚠️ No userId available yet, skipping machine fetch.");
      return;
    }

    console.log("[RunLogger] userId received:", userId);
    setLoadingMachines(true);

    const url = `${API_URL}?action=machines&email=${encodeURIComponent(
      userId
    )}`;
    console.log("[RunLogger] Fetching machines from:", url);

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log("[RunLogger] Raw machine API response:", data);

        // Handle case where backend returns { list: [...] }
        const machineList = Array.isArray(data)
          ? data
          : Array.isArray(data.list)
          ? data.list
          : null;

        if (machineList) {
          const sorted = machineList
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
          setMachines(sorted);
        } else {
          showToast("⚠️ Could not load machines");
          console.warn("⚠️ Unexpected machines response:", data);
        }
      })
      .catch((err) => {
        console.error("⚠️ Error loading machine list:", err);
        showToast("⚠️ Network error loading machines");
      })
      .finally(() => setLoadingMachines(false));
  }, [userId, showToast]);

  const handleStart = async () => {
    if (!selected) return showToast("⚠️ Select a machine first");

    setStartDisabled(true);
    setLoading(true);
    const now = new Date();
    setRunInfo({ machine: selected, start: now, end: null, duration: null });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "start", machine: selected, userId }),
      });
      const data = await res.json();

      if (data.success) {
        setStopDisabled(false);
        showToast("✅ Machine Started");
      } else {
        setStartDisabled(false);
        showToast("❌ " + (data.message || "Failed to start"));
      }
    } catch (err) {
      console.error("❌ Start error:", err);
      setStartDisabled(false);
      showToast("❌ Backend error");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!selected) return showToast("⚠️ Select a machine first");

    setStopDisabled(true);
    setLoading(true);
    try {
      const now = new Date();
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "stop", machine: selected, userId }),
      });
      const data = await res.json();

      if (data.success) {
        const startTime = runInfo?.start ? new Date(runInfo.start) : now;
        const durationMins = Math.max(0, (now - startTime) / 60000).toFixed(2);

        setRunInfo((prev) => ({
          ...(prev || { machine: selected, start: startTime }),
          end: now,
          duration: `${durationMins}`,
        }));

        setStartDisabled(false);
        showToast("🛑 Machine Stopped");
        window.setTimeout(() => setRunInfo(null), 120000);
      } else {
        setStopDisabled(false);
        showToast("❌ " + (data.message || "Failed to stop"));
      }
    } catch (err) {
      console.error("❌ Stop error:", err);
      setStopDisabled(false);
      showToast("❌ Backend error");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async () => {
    if (!selected) return showToast("⚠️ Select a machine first");

    const now = new Date();
    const totalMinutes =
      Number(days) * 1440 + Number(hours) * 60 + Number(minutes);

    if (Number.isNaN(totalMinutes) || totalMinutes < 0) {
      return showToast("⚠️ Invalid custom duration");
    }

    const customEnd = new Date(now.getTime() + totalMinutes * 60000);
    const customEndStr = customEnd
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(",", "");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "customStop",
          machine: selected,
          userId,
          customEnd: customEndStr,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setRunInfo({
          machine: selected,
          start: now,
          end: customEnd,
          duration: `${Number(days)}d ${Number(hours)}h ${Number(minutes)}m`,
        });
        setStartDisabled(false);
        showToast("✅ Custom End Time Logged");
        window.setTimeout(() => setRunInfo(null), 120000);
      } else {
        showToast("❌ " + (data.message || "Failed to log custom end"));
      }
    } catch (err) {
      console.error("❌ Custom stop error:", err);
      showToast("❌ Backend error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 relative">
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

        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useCustomEnd}
              onChange={(e) => setUseCustomEnd(e.target.checked)}
            />
            <span>Use Custom End Time</span>
          </label>
          {useCustomEnd && (
            <div className="flex space-x-2 mt-2">
              <input
                type="number"
                min="0"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-16 border px-2 py-1 rounded"
                placeholder="dd"
              />
              <input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-16 border px-2 py-1 rounded"
                placeholder="hh"
              />
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-16 border px-2 py-1 rounded"
                placeholder="mm"
              />
              <button
                className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
                onClick={handleCustomSubmit}
              >
                Submit
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4 mb-4">
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            onClick={handleStart}
            disabled={startDisabled || loading || useCustomEnd}
          >
            {loading && startDisabled ? "Starting..." : "Start"}
          </button>
          <button
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            onClick={handleStop}
            disabled={stopDisabled || loading || useCustomEnd}
          >
            {loading && stopDisabled ? "Stopping..." : "Stop"}
          </button>
        </div>

        {runInfo && (
          <div className="mt-4 text-sm text-gray-700 animate-fade">
            <p>
              🟢 Start:{" "}
              {runInfo.start ? new Date(runInfo.start).toLocaleString() : "--"}
            </p>
            {runInfo.end && (
              <p>🔴 End: {new Date(runInfo.end).toLocaleString()}</p>
            )}
            {runInfo.duration && (
              <p>⏱ Duration: {formatDuration(runInfo.duration)}</p>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed left-1/2 bottom-8 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded shadow z-50 animate-bounce">
          {toast}
        </div>
      )}

      <style>{`
        .animate-fade { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

export default RunLogger;
