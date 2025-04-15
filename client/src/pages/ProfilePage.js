import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    console.log("ProfilePage rendered, token:", token);

    useEffect(() => {
        console.log("ProfilePage useEffect triggered, token:", token);
        if (!token) {
            console.log("No token, redirecting to /login");
            navigate("/login");
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                console.log("Fetching profile data");
                const resUser = await fetch("http://localhost:5000/api/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Profile response status:", resUser.status);
                if (!resUser.ok) {
                    throw new Error(`Ошибка профиля: ${resUser.status}`);
                }
                const userData = await resUser.json();
                console.log("Profile data:", userData);

                console.log("Fetching trips data");
                const resTrips = await fetch("http://localhost:5000/api/trips", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Trips response status:", resTrips.status);
                if (!resTrips.ok) {
                    throw new Error(`Ошибка загрузки поездок: ${resTrips.status}`);
                }
                const tripsData = await resTrips.json();
                console.log("Trips data:", tripsData);

                setUser(userData);
                setTrips(tripsData);
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
            } finally {
                setLoading(false);
                console.log("Loading set to false");
            }
        };

        fetchProfile();
    }, [token, navigate]);

    if (loading) {
        console.log("Rendering loading state");
        return <p>Загрузка...</p>;
    }
    if (!user) {
        console.log("Rendering error state");
        return <p>Ошибка загрузки профиля. Проверьте, авторизованы ли вы.</p>;
    }

    console.log("Rendering profile data, user:", user, "trips:", trips);
    return (
        <div className="profile-container">
            <div className="profile-header">
                <img src="/images/avatarr.jpg" alt="User Avatar" className="avatar" />
                <h1>Личный кабинет</h1>
                <p><strong>Имя:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {user.created_at && (
                    <p><strong>Дата регистрации:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                )}
            </div>

            <h2>Ваши поездки</h2>
            {trips.length > 0 ? (
                <ul>
                    {trips.map((trip) => (
                        <li key={trip.id}>
                            <strong>{trip.title}</strong> (
                            {new Date(trip.start_date).toLocaleString()} -{" "}
                            {new Date(trip.end_date).toLocaleString()}
                            ) - Бюджет: {trip.budget} руб.
                        </li>
                    ))}
                </ul>
            ) : (
                <p>У вас пока нет поездок.</p>
            )}
        </div>
    );
};

export default ProfilePage;