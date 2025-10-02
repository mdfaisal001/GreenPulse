const express = require("express");
const router = express.Router();
const { getAgroData } = require("../controllers/agroController");

router.get("/", getAgroData);

module.exports = router;
