const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Middleware для проверки токена
const auth = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "Токен не предоставлен" });
    }
    
    // Логируем секрет для проверки
    console.log("JWT_SECRET на сервере:", process.env.JWT_SECRET);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Ошибка при верификации токена:", error.message); // Логирование ошибки
        res.status(401).json({ error: "Недействительный токен" });
    }
};


// Middleware для проверки роли администратора
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ error: "Доступ запрещен: требуется роль администратора" });
        }
        next();
    } catch (error) {
        console.error("Ошибка при проверке роли администратора:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

// Получение всех предопределенных (публичных) маршрутов
router.get("/predefined-trips", async (req, res) => {
    try {
        const trips = await Trip.findAll({ where: { isPublic: true } });
        res.json(trips);
    } catch (error) {
        console.error("Ошибка при получении предопределенных маршрутов:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Обновление маршрута (только для администратора)
router.put("/predefined-trips/:id", auth, isAdmin, async (req, res) => {
    try {
        const trip = await Trip.findByPk(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: "Маршрут не найден" });
        }

        await trip.update(req.body);
        res.json(trip);
    } catch (error) {
        console.error("Ошибка при обновлении маршрута:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Удаление маршрута (только для администратора)
router.delete("/predefined-trips/:id", auth, isAdmin, async (req, res) => {
    try {
        const trip = await Trip.findByPk(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: "Маршрут не найден" });
        }

        await trip.destroy();
        res.json({ message: "Маршрут успешно удален" });
    } catch (error) {
        console.error("Ошибка при удалении маршрута:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Получение личных маршрутов пользователя
router.get("/trips", auth, async (req, res) => {
    try {
        const trips = await Trip.findAll({ where: { userId: req.user.id } });
        res.json(trips);
    } catch (error) {
        console.error("Ошибка при получении личных маршрутов:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Создание нового маршрута
router.post("/trips", auth, async (req, res) => {
    try {
        const trip = await Trip.create({
            ...req.body,
            userId: req.user.id,
            isPublic: req.body.isPublic || false,
        });
        res.status(201).json(trip);
    } catch (error) {
        console.error("Ошибка при создании маршрута:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

module.exports = router;