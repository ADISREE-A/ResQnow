const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { getAllOfficers, verifyOfficer, getOfficerById, createOfficer, updateOfficer, deactivateOfficer } = require("../models/OfficerModel");

/* ===============================
   🔹 GET All Officers
================================ */
router.get("/", (req, res) => {
  getAllOfficers((err, results) => {
    if (err) {
      console.error("Error fetching officers:", err);
      return res.status(500).json({ error: "Failed to fetch officers" });
    }
    res.json(results);
  });
});

/* ===============================
   🔹 GET Officer by ID
================================ */
router.get("/:id", (req, res) => {
  const { id } = req.params;
  
  getOfficerById(id, (err, results) => {
    if (err) {
      console.error("Error fetching officer:", err);
      return res.status(500).json({ error: "Failed to fetch officer" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Officer not found" });
    }
    res.json(results[0]);
  });
});

/* ===============================
   🔹 POST Login Officer
================================ */
router.post("/login", (req, res) => {
  const { badge_number, password } = req.body;

  if (!badge_number || !password) {
    return res.status(400).json({ error: "Badge number and password are required" });
  }

  verifyOfficer(badge_number, password, (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const officer = results[0];
    res.json({
      message: "Login successful",
      officer: {
        id: officer.id,
        badge_number: officer.badge_number,
        officer_name: officer.officer_name,
        rank: officer.rank,
        station: officer.station,
        email: officer.email
      }
    });
  });
});

/* ===============================
   🔹 POST Create New Officer
================================ */
router.post("/", (req, res) => {
  const { badge_number, officer_name, rank, station, email, password } = req.body;

  if (!badge_number || !officer_name || !password) {
    return res.status(400).json({ error: "Badge number, officer name, and password are required" });
  }

  const newOfficer = {
    badge_number,
    officer_name,
    rank: rank || null,
    station: station || null,
    email: email || null,
    password_hash: password
  };

  createOfficer(newOfficer, (err, result) => {
    if (err) {
      console.error("Error creating officer:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "Badge number already exists" });
      }
      return res.status(500).json({ error: "Failed to create officer" });
    }
    res.status(201).json({
      message: "Officer created successfully",
      officer_id: result.insertId
    });
  });
});

/* ===============================
   🔹 PUT Update Officer
================================ */
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { officer_name, rank, station, email } = req.body;

  if (!officer_name) {
    return res.status(400).json({ error: "Officer name is required" });
  }

  updateOfficer(id, { officer_name, rank, station, email }, (err, result) => {
    if (err) {
      console.error("Error updating officer:", err);
      return res.status(500).json({ error: "Failed to update officer" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Officer not found" });
    }
    res.json({ message: "Officer updated successfully" });
  });
});

/* ===============================
   🔹 DELETE Deactivate Officer
================================ */
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  deactivateOfficer(id, (err, result) => {
    if (err) {
      console.error("Error deactivating officer:", err);
      return res.status(500).json({ error: "Failed to deactivate officer" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Officer not found" });
    }
    res.json({ message: "Officer deactivated successfully" });
  });
});

module.exports = router;

