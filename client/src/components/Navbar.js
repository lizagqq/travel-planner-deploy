import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Navbar.css";

const Navbar = () => {
    const [username, setUsername] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) return;

            try {
                const response = await fetch("http://localhost:5000/api/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Response status:", response.status); // Добавь лог
                if (!response.ok) {
                    throw new Error(`Ошибка сервера: ${response.status}`);
                }
                const data = await response.json();
                console.log("Profile data from server:", data); // Добавь лог
                setUsername(data.username);
                setIsAdmin(data.role === "admin");
            } catch (error) {
                console.error("Ошибка загрузки профиля:", error);
                setUsername("");
                setIsAdmin(false);
            }
        };
        fetchUser();
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUsername("");
        setIsAdmin(false);
        toast.success("Вы вышли из системы");
        navigate("/");
    };

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-brand">
                    Travel Planner
                </Link>
                <div className="navbar-links">
                    <Link to="/" className="navbar-link">
                        Главная
                    </Link>
                    {token ? (
                        <>
                            <Link to="/routes" className="navbar-link">
                                Мои маршруты
                            </Link>
                            <Link to="/add-route" className="navbar-link">
                                Создать маршрут
                            </Link>
                            {isAdmin && (
                                <Link to="/admin" className="navbar-link">
                                    Панель администратора
                                </Link>
                            )}
                            <Link to="/profile" className="navbar-link">
                                Привет, {username || "Пользователь"}!
                            </Link>
                            <button onClick={handleLogout} className="navbar-btn">
                                Выйти
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="navbar-link">
                            Создать свой маршрут!
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;