const express = require("express");
const router = express.Router();
const { getLocation } = require("../controllers/locationController");

router.get("/", getLocation);

module.exports = router;
