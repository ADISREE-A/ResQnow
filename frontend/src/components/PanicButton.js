import React from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const PanicButton = () => {

  const navigate = useNavigate();

  const activateEmergency = () => {
    navigator.geolocation.getCurrentPosition((position) => {

      const { latitude, longitude } = position.coords;

      API.post("/emergency/create", {
        latitude,
        longitude,
        type: "general"
      })
      .then(() => {
        navigate("/survival");
      })
      .catch((err) => {
        console.error(err);
      });

    });
  };

  return (
    <button
      onClick={activateEmergency}
      style={{
        backgroundColor: "red",
        color: "white",
        padding: "30px",
        fontSize: "20px",
        borderRadius: "50%",
        border: "none"
      }}
    >
      PANIC
    </button>
  );
};

export default PanicButton;
