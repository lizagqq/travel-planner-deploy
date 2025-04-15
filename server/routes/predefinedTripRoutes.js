const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const {
    getPredefinedTrips,
    addPredefinedTrip,
    updatePredefinedTrip,
    deletePredefinedTrip,
} = require("../controllers/predefinedTripController");

const router = express.Router();

// Доступно всем
router.get("/predefined-trips", getPredefinedTrips);


// Доступно только администратору
router.post("/predefined-trips", authMiddleware, adminMiddleware, addPredefinedTrip);
router.put("/predefined-trips/:id", authMiddleware, adminMiddleware, updatePredefinedTrip);
router.delete("/predefined-trips/:id", authMiddleware, adminMiddleware, deletePredefinedTrip);

module.exports = router;