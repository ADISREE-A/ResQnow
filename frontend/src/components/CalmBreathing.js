import React, { useEffect, useState } from "react";

const CalmBreathing = () => {

  const [phase, setPhase] = useState("Inhale");

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev =>
        prev === "Inhale" ? "Exhale" : "Inhale"
      );
    }, 4000); // 4 seconds inhale/exhale

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.circle,
          transform:
            phase === "Inhale" ? "scale(1.4)" : "scale(1)"
        }}
      />
      <p style={styles.text}>
        {phase} slowly...
      </p>
    </div>
  );
};

const styles = {
  container: {
    marginTop: "30px",
    textAlign: "center"
  },
  circle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    backgroundColor: "rgba(0,150,255,0.6)",
    margin: "0 auto",
    transition: "transform 4s ease-in-out"
  },
  text: {
    marginTop: "15px",
    fontSize: "18px",
    fontWeight: "bold"
  }
};

export default CalmBreathing;