const express = require("express");
const router = express.Router();
const { saveLocation } = require("../controllers/locationController");

router.post("/update", saveLocation);

module.exports = router;
