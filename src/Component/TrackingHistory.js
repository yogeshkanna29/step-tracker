import React, { useState, useEffect, useRef } from "react";

// Your existing StepTracker, modified to accept tracking state and callbacks
const StepTracker = ({
  isTracking,
  onStart,
  onStop,
  sensitivity,
  onSensitivityChange,
  steps,
  distance,
  duration,
  frequency,
  onReset,
}) => {
  return (
    <div style={styles.container}>
      <h2>🏃 Step Tracker</h2>

      <div style={styles.stats}>
        <p><strong>Steps:</strong> {steps}</p>
        <p><strong>Distance:</strong> {distance} meters</p>
        <p><strong>Duration:</strong> {duration}</p>
        <p><strong>Step Frequency:</strong> {frequency} steps/min</p>
      </div>

      <div style={styles.controls}>
        <button onClick={isTracking ? onStop : onStart} style={styles.button}>
          {isTracking ? "Stop" : "Start"}
        </button>
        <button onClick={onReset} style={styles.button}>Reset</button>
      </div>

      <div style={styles.slider}>
        <label>
          Sensitivity: {sensitivity}
          <input
            type="range"
            min="5"
            max="20"
            step="0.5"
            value={sensitivity}
            onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
};

const TrackingHistory = ({ sessions, onDelete }) => {
  return (
    <div style={historyStyles.container}>
      <h2>Tracking History</h2>
      {sessions.length === 0 && <p>No sessions yet.</p>}
      <ul style={historyStyles.list}>
        {sessions.map((session, idx) => (
          <li key={idx} style={historyStyles.listItem}>
            <div>
              <div><strong>Start:</strong> {session.start.toLocaleString()}</div>
              <div><strong>End:</strong> {session.end ? session.end.toLocaleString() : "Ongoing"}</div>
            </div>
            <button
              onClick={() => onDelete(idx)}
              style={historyStyles.deleteBtn}
              aria-label="Delete session"
              title="Delete session"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Parent component managing state and integration
const StepTrackerApp = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sensitivity, setSensitivity] = useState(
    parseFloat(localStorage.getItem("sensitivity")) || 12
  );
  const [steps, setSteps] = useState(parseInt(localStorage.getItem("steps")) || 0);
  const [distance, setDistance] = useState(steps * 0.762);
  const [duration, setDuration] = useState(0);
  const [frequency, setFrequency] = useState(0);

  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Start tracking
  const startTracking = () => {
    setIsTracking(true);
    startTimeRef.current = new Date();

    // Add a new session with null end
    setSessions((prev) => [...prev, { start: new Date(), end: null }]);
    setDuration(0);
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    // Update the last session end time
    setSessions((prev) => {
      if (prev.length === 0) return prev;
      const lastSession = prev[prev.length - 1];
      if (lastSession.end !== null) return prev;
      const updatedSession = { ...lastSession, end: new Date() };
      return [...prev.slice(0, prev.length - 1), updatedSession];
    });
  };

  // Reset steps and stats
  const resetSteps = () => {
    setSteps(0);
    setDistance(0);
    setDuration(0);
    setFrequency(0);
    localStorage.setItem("steps", "0");
  };

  // Delete a session
  const deleteSession = (index) => {
    setSessions((prev) => prev.filter((_, i) => i !== index));
  };

  // Sensitivity change
  const handleSensitivityChange = (value) => {
    setSensitivity(value);
    localStorage.setItem("sensitivity", value);
  };

  // Timer for duration
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

  // Motion listener
  useEffect(() => {
    const handleMotion = (event) => {
      if (!isTracking) return;
      if (!event.accelerationIncludingGravity) return;

      const { x, y, z } = event.accelerationIncludingGravity;
      const last = lastAcceleration.current;

      const delta = Math.abs(x - last.x) + Math.abs(y - last.y) + Math.abs(z - last.z);

      if (delta > sensitivity) {
        setSteps((prev) => {
          const newSteps = prev + 1;
          localStorage.setItem("steps", newSteps);
          setDistance(parseFloat((newSteps * 0.762).toFixed(2)));
          if (duration > 0) setFrequency(Math.round(newSteps / (duration / 60)));
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

  // Format duration
  const formatDuration = () => {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20 }}>
      <StepTracker
        isTracking={isTracking}
        onStart={startTracking}
        onStop={stopTracking}
        sensitivity={sensitivity}
        onSensitivityChange={handleSensitivityChange}
        steps={steps}
        distance={distance}
        duration={formatDuration()}
        frequency={frequency}
        onReset={resetSteps}
      />
      <TrackingHistory sessions={sessions} onDelete={deleteSession} />
    </div>
  );
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
  },
  stats: {
    marginBottom: "1.5rem",
    fontSize: "1.2rem",
  },
  controls: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "1rem",
  },
  button: {
    padding: "10px 20px",
    fontSize: "1rem",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
  },
  slider: {
    marginTop: "1rem",
  },
};

const historyStyles = {
  container: {
    maxWidth: 400,
    margin: "2rem auto",
    padding: 20,
    textAlign: "center",
    border: "1px solid #ccc",
    borderRadius: 12,
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    backgroundColor: "#fdfdfd",
  },
  list: {
    listStyle: "none",
    padding: 0,
    marginTop: 10,
  },
  listItem: {
    marginTop: 10,
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    color: "red",
  },
};

export default StepTrackerApp;
