import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    console.log("PrivateRoute checking token:", token);

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                console.log("No token, not authenticated");
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log("Response status from /api/user/me:", response.status);
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Ошибка проверки авторизации:", error);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [token]);

    if (loading) {
        console.log("PrivateRoute: still loading");
        return <div>Загрузка...</div>;
    }

    console.log("PrivateRoute: rendering, isAuthenticated:", isAuthenticated);
    if (isAuthenticated) {
        console.log("Rendering Outlet with children");
        return <Outlet />;
    } else {
        console.log("Redirecting to /login");
        return <Navigate to="/login" />;
    }
};

export default PrivateRoute;
