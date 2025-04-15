const jwt = require("jsonwebtoken");
const pool = require("../db");

const verifyToken = (token) => {
    if (!token) return null;
    try {
        const SECRET_KEY = process.env.JWT_SECRET; // Бери секрет здесь
        console.log("SECRET_KEY in verifyToken:", SECRET_KEY); // Лог для отладки
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id; // Ожидаем id в токене
        if (!userId) return null;
        return { userId };
    } catch (error) {
        console.error("Ошибка при верификации токена:", error.message);
        return null;
    }
};

const authMiddleware = async (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    console.log("Token in authMiddleware:", token); // Лог для отладки
    const result = verifyToken(token);

    if (!result) {
        return res.status(401).json({ error: "Нет токена или недействительный токен" });
    }

    const { userId } = result;

    try {
        const userQuery = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        req.user = { id: userId };
        next();
    } catch (error) {
        console.error("Ошибка при проверке пользователя:", error.message);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

const adminMiddleware = async (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const result = verifyToken(token);

    if (!result) {
        return res.status(401).json({ error: "Нет токена или недействительный токен" });
    }

    const { userId } = result;

    try {
        const userQuery = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const userRole = userQuery.rows[0].role;
        if (userRole !== "admin") {
            return res.status(403).json({ error: "Доступ запрещен: требуется роль администратора" });
        }

        req.user = { id: userId, role: userRole };
        next();
    } catch (error) {
        console.error("Ошибка при проверке роли администратора:", error.message);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

module.exports = { authMiddleware, adminMiddleware };