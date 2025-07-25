import React, { useEffect, useState, useRef } from "react";

const StepTracker = () => {
  // Step counting states
  const [steps, setSteps] = useState(
    parseInt(localStorage.getItem("steps")) || 0
  );
  const [isTracking, setIsTracking] = useState(false);
  const [sensitivity, setSensitivity] = useState(
    parseFloat(localStorage.getItem("sensitivity")) || 12
  );
  const [distance, setDistance] = useState(steps * 0.762);
  const [duration, setDuration] = useState(0);
  const [frequency, setFrequency] = useState(0);

  // History sessions: each has { start: Date, end: Date | null }
  const [sessions, setSessions] = useState([]);

  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const timerRef = useRef(null);

  // Start tracking: add a session with start time
  const startTracking = () => {
    setIsTracking(true);
    setDuration(0);
    setSessions((prev) => [...prev, { start: new Date(), end: null }]);
  };

  // Stop tracking: update the last session end time
  const stopTracking = () => {
    setIsTracking(false);
    setSessions((prev) => {
      if (prev.length === 0) return prev;
      const lastSession = prev[prev.length - 1];
      if (lastSession.end !== null) return prev; // already ended

      const updatedSession = { ...lastSession, end: new Date() };
      return [...prev.slice(0, prev.length - 1), updatedSession];
    });
  };

  // Duration timer effect
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isTracking]);

  // Step counting motion effect
  useEffect(() => {
    const handleMotion = (event) => {
      if (!isTracking) return;
      if (!event.accelerationIncludingGravity) return;

      const { x, y, z } = event.accelerationIncludingGravity;
      const last = lastAcceleration.current;

      const delta =
        Math.abs(x - last.x) + Math.abs(y - last.y) + Math.abs(z - last.z);

      if (delta > sensitivity) {
        setSteps((prev) => {
          const newSteps = prev + 1;
          localStorage.setItem("steps", newSteps);
          setDistance(parseFloat((newSteps * 0.762).toFixed(2)));
          if (duration > 0)
            setFrequency(Math.round(newSteps / (duration / 60)));
          return newSteps;
        });
      }

      lastAcceleration.current = { x, y, z };
    };

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [isTracking, sensitivity, duration]);

  // Reset steps & stats & sessions
  const resetAll = () => {
    setSteps(0);
    setDistance(0);
    setDuration(0);
    setFrequency(0);
    setSessions([]);
    localStorage.setItem("steps", "0");
  };

  // Delete single session by index
  const deleteSession = (index) => {
    setSessions((prev) => prev.filter((_, i) => i !== index));
  };

  // Share stats handler
  const shareStats = () => {
    if (sessions.length === 0) {
      alert("No sessions to share!");
      return;
    }
    const lastSession = sessions[sessions.length - 1];
    const startTimeStr = lastSession.start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endTimeStr = lastSession.end
      ? lastSession.end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "Ongoing";
    const durationStr = formatDuration(duration);

    const message = `🏃 Step Tracker Stats:
Distance covered: ${distance} meters
Duration: ${durationStr}
Start time: ${startTimeStr}
End time: ${endTimeStr}`;

    // WhatsApp sharing URL
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    // Use Web Share API if available, fallback to WhatsApp link
    if (navigator.share) {
      navigator
        .share({
          title: "Step Tracker Stats",
          text: message,
        })
        .catch(() => {
          window.open(whatsappUrl, "_blank");
        });
    } else {
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleSensitivityChange = (e) => {
    const value = parseFloat(e.target.value);
    setSensitivity(value);
    localStorage.setItem("sensitivity", value);
  };

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${mins}m ${seconds}s`;
  };

  const styles = {
    container: {
      maxWidth: "400px",
      margin: "2rem auto",
      padding: "2rem",
      textAlign: "center",
      border: "1px solid #ccc",
      borderRadius: "12px",
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      backgroundColor: "#fdfdfd",
      fontFamily: "Arial, sans-serif",
    },
    stats: {
      marginBottom: "1.5rem",
      fontSize: "1.2rem",
    },
    controls: {
      display: "flex",
      justifyContent: "space-around",
      marginBottom: "1rem",
      flexWrap: "wrap",
      gap: "10px",
    },
    button: {
      padding: "10px 20px",
      fontSize: "1rem",
      borderRadius: "6px",
      cursor: "pointer",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      minWidth: "100px",
    },
    shareButton: {
      backgroundColor: "#25D366",
      marginTop: "10px",
      minWidth: "220px",
    },
    slider: {
      marginTop: "1rem",
    },
    historyContainer: {
      marginTop: "2rem",
      textAlign: "left",
      maxWidth: "400px",
      marginLeft: "auto",
      marginRight: "auto",
    },
    sessionItem: {
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "10px",
      marginBottom: "10px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    deleteButton: {
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "1.4rem",
      color: "#ff4d4f",
      lineHeight: 1,
    },
  };

  return (
    <div style={styles.container}>
      <h2>🏃 Step Tracker</h2>

      <div style={styles.stats}>
        <p>
          <strong>Steps:</strong> {steps}
        </p>
        <p>
          <strong>Distance:</strong> {distance} meters
        </p>
        <p>
          <strong>Duration:</strong> {formatDuration(duration)}
        </p>
        <p>
          <strong>Step Frequency:</strong> {frequency} steps/min
        </p>
      </div>

      <div style={styles.controls}>
        {!isTracking ? (
          <button onClick={startTracking} style={styles.button}>
            Start
          </button>
        ) : (
          <button onClick={stopTracking} style={styles.button}>
            Stop
          </button>
        )}
        <button onClick={resetAll} style={styles.button}>
          Reset All
        </button>
      </div>

      <button
        onClick={shareStats}
        style={{ ...styles.button, ...styles.shareButton }}
      >
        Share Stats 📨
      </button>

      <div style={styles.slider}>
        <label>
          Sensitivity: {sensitivity}
          <input
            type="range"
            min="5"
            max="20"
            step="0.5"
            value={sensitivity}
            onChange={handleSensitivityChange}
          />
        </label>
      </div>

      {/* History Section */}
      <div style={styles.historyContainer}>
        <h3>Tracking History</h3>
        {sessions.length === 0 && <p>No sessions recorded yet.</p>}
        {sessions.map((session, idx) => (
          <div key={idx} style={styles.sessionItem}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>
                <strong>Start:</strong> {session.start.toLocaleString()}
              </div>
              <div>
                <strong>End:</strong>{" "}
                {session.end ? session.end.toLocaleString() : "Ongoing"}
              </div>
            </div>
            <button
              onClick={() => deleteSession(idx)}
              style={styles.deleteButton}
              aria-label="Delete session"
              title="Delete session"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepTracker;
