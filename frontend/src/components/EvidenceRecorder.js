import React, { useState, useRef } from "react";

const EvidenceRecorder = ({ caseId }) => {

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {

      const blob = new Blob(chunks.current, { type: "video/webm" });
      chunks.current = [];

      const formData = new FormData();
      formData.append("file", blob, "evidence.webm");

      navigator.geolocation.getCurrentPosition(async (position) => {

        formData.append("latitude", position.coords.latitude);
        formData.append("longitude", position.coords.longitude);
        formData.append("case_id", caseId); // Send case ID for unified tracking

        await fetch("http://localhost:5000/api/evidence/upload", {
          method: "POST",
          body: formData
        });

        alert("Evidence uploaded successfully");
      });
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div style={{ background: "#111", padding: "15px", borderRadius: "10px" }}>
      <h3>📷 Evidence Recording</h3>

      {!recording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording} style={{ background: "red", color: "white" }}>
          Stop & Upload
        </button>
      )}
    </div>
  );
};

export default EvidenceRecorder;