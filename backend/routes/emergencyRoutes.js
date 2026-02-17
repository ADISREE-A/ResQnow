const express = require("express");
const router = express.Router();
const { createEmergency } = require("../controllers/emergencyController");

router.post("/create", createEmergency);

module.exports = router;
