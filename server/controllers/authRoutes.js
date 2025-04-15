const express = require("express");
const { body } = require("express-validator");
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const pool = require("../db");

const router = express.Router();

router.post(
    "/register",
    [
        body("username").notEmpty().withMessage("Имя пользователя не может быть пустым"),
        body("email").isEmail().withMessage("Некорректный email"),
        body("password").isLength({ min: 6 }).withMessage("Пароль должен быть не менее 6 символов")
    ],
    registerUser
);

router.post("/login", loginUser);

router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, email, created_at FROM users WHERE id = $1", [req.user.id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        res.json(user.rows[0]);
    } catch (error) {
        console.error("Ошибка при получении профиля:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

module.exports = router;