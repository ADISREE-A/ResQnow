import React, { useEffect, useState } from "react";

const EvidenceList = () => {

  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvidence = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/evidence/all");
      const data = await res.json();

      // 🔥 Only show non-deleted evidence
      const activeEvidence = data.filter(item => item.is_deleted === 0);

      setEvidence(activeEvidence);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleSoftDelete = async (id) => {
    const confirmDelete = window.confirm("Move this evidence to archive?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/evidence/delete/${id}`,
        { method: "PUT" }
      );

      const result = await res.json();
      console.log(result);

      fetchEvidence(); // refresh list
    } catch (error) {
      console.error("Archive failed:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📷 Uploaded Evidence</h2>

      {loading && <p>Loading...</p>}
      {!loading && evidence.length === 0 && <p>No active evidence found.</p>}

      {evidence.map(item => (
        <div
          key={item.id}
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#1a1a1a",
            borderRadius: "10px",
            border: "1px solid #333"
          }}
        >
          <p><strong>ID:</strong> {item.id}</p>
          <p><strong>Location:</strong> {item.latitude}, {item.longitude}</p>
          <p>
            <strong>Uploaded:</strong>{" "}
            {new Date(item.created_at).toLocaleString()}
          </p>

          <video
            width="320"
            controls
            style={{ borderRadius: "8px", marginTop: "10px" }}
            src={`http://localhost:5000/${item.file_path}`}
          />

          <br />

          <button
            onClick={() => handleSoftDelete(item.id)}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "#8b0000",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            📦 Move to Archive
          </button>
        </div>
      ))}
    </div>
  );
};

export default EvidenceList;