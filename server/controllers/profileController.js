// controllers/profileController.js
const pool = require("../db");

const getProfile = async (req, res) => {
    const userId = req.user.id; // Извлекаем userId из токена
    try {
        const user = await pool.query("SELECT id, username, email, created_at FROM users WHERE id = $1", [userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }
        res.json(user.rows[0]);
    } catch (error) {
        console.error("Ошибка при получении профиля:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

module.exports = { getProfile };