// src/StepCounter.js
import React, { useEffect, useState } from "react";

const StepCounter = () => {
  const [steps, setSteps] = useState(0);
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [lastAcceleration, setLastAcceleration] = useState({ x: 0, y: 0, z: 0 });

  const threshold = 12; // adjust this based on device

  useEffect(() => {
    let isRunning = true;

    const handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity;

      const delta =
        Math.abs(x - lastAcceleration.x) +
        Math.abs(y - lastAcceleration.y) +
        Math.abs(z - lastAcceleration.z);

      if (delta > threshold) {
        setSteps((prev) => prev + 1);
      }

      setLastAcceleration({ x, y, z });
    };

    if (typeof window !== "undefined" && window.DeviceMotionEvent) {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      isRunning = false;
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [lastAcceleration]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>🏃 Step Counter</h2>
      <h1>{steps}</h1>
      <p>Keep your phone in your pocket and start walking!</p>
    </div>
  );
};

export default StepCounter;
