const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware для проверки токена
const auth = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "Токен не предоставлен" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Недействительный токен" });
    }
};

// Регистрация пользователя
router.post("/register", async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: "Пользователь с таким именем уже существует" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            password: hashedPassword,
            role: role || "user",
        });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(201).json({ token });
    } catch (error) {
        console.error("Ошибка при регистрации:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Авторизация пользователя
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({ error: "Неверное имя пользователя или пароль" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { // Исправляем isMATCH на isMatch
            return res.status(400).json({ error: "Неверное имя пользователя или пароль" });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (error) {
        console.error("Ошибка при авторизации:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Получение данных текущего пользователя
router.get("/me", auth, async (req, res) => {
    try {
        const userQuery = await client.query(
            "SELECT id, username, role FROM users WHERE id = $1",
            [req.user.id]
        );
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