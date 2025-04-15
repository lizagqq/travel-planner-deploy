const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const pool = require("../db");

const SECRET_KEY = process.env.JWT_SECRET;

const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO Users (username, email, password_hash) VALUES ($1, $2, $3)",
            [username, email, hashedPassword]
        );

        res.json({ message: "Пользователь зарегистрирован!" });
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query("SELECT * FROM Users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(400).json({ error: "Неверный email или пароль" });

        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!isMatch) return res.status(400).json({ error: "Неверный email или пароль" });

        const token = jwt.sign({ userId: user.rows[0].id }, SECRET_KEY, { expiresIn: "30d" }); // ✅ Изменено на 30 дней

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

module.exports = { registerUser, loginUser };