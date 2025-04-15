import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./LoginPage.css";


const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    const { from } = location.state || { from: "/routes" }; // Изменяем на /routes

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isLogin
            ? `${process.env.REACT_APP_API_URL}/api/user/login`
            : `${process.env.REACT_APP_API_URL}/api/user/register`;
        const body = isLogin
            ? { email, password }
            : { username, email, password };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                if (isLogin) {
                    localStorage.setItem("token", data.token);
                    toast.success("Вы успешно вошли!");
                    navigate(from);
                } else {
                    toast.success("Регистрация прошла успешно! Теперь войдите.");
                    setIsLogin(true);
                }
            } else {
                toast.error(data.error || "Ошибка при выполнении запроса");
            }
        } catch (error) {
            toast.error("Ошибка сервера");
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1 className="login-title">{isLogin ? "Вход" : "Регистрация"}</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">Имя пользователя:</label>
                            <input
                                type="text"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Email:</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Пароль:</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-button">
                        {isLogin ? "Войти" : "Зарегистрироваться"}
                    </button>
                </form>
                <p className="toggle-text">
                    {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
                    <button
                        className="toggle-button"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Зарегистрироваться" : "Войти"}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
