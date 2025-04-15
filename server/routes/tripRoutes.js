const express = require("express");
const { addTrip, getUserTrips, updateTrip, deleteTrip } = require("../controllers/tripController");
const { authMiddleware } = require("../middleware/authMiddleware");

console.log("addTrip:", addTrip);
console.log("getUserTrips:", getUserTrips);

const router = express.Router();

router.post("/trips", authMiddleware, addTrip);
router.get("/trips", authMiddleware, getUserTrips);
router.put("/trips/:id", authMiddleware, updateTrip);
router.delete("/trips/:id", authMiddleware, deleteTrip);

module.exports = router;