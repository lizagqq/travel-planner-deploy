const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const pool = require("../db");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("Извлечённый userId в /profile:", userId);
        const user = await pool.query(
            "SELECT id, username, email, created_at FROM users WHERE id = $1",
            [userId]
        );
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }
        res.json(user.rows[0]);
    } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

module.exports = router;