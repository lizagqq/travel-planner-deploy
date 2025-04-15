const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
            [username, email, hashedPassword, "user"]
        );
        res.json(newUser.rows[0]);
    } catch (error) {
        console.error("Ошибка при регистрации:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = userQuery.rows[0];

        if (!user) {
            return res.status(400).json({ error: "Неверный email или пароль" });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: "Неверный email или пароль" });
        }

        console.log("JWT_SECRET:", process.env.JWT_SECRET); // Временный лог для проверки
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
        console.log("Созданный токен при авторизации:", token);
        res.json({ token });
    } catch (error) {
        console.error("Ошибка при авторизации:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

router.get("/me", authMiddleware, async (req, res) => {
    try {
        console.log("Ищем пользователя с id:", req.user.id);
        const userQuery = await pool.query(
            "SELECT id, username, role FROM users WHERE id = $1",
            [req.user.id]
        );
        console.log("Результат запроса:", userQuery.rows);
        const user = userQuery.rows[0];
        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }
        res.json({ id: user.id, username: user.username, role: user.role });
    } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

module.exports = router;