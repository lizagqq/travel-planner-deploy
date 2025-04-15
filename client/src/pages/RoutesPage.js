import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./RoutesPage.css";
import { API_URL } from "../config";

const RoutesPage = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [editingTrip, setEditingTrip] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        start_date: "",
        end_date: "",
        budget: "",
        destinations: [],
    });
    const [newDestination, setNewDestination] = useState({
        name: "",
        date: "",
        cost: "",
        notes: "",
    });
    const token = localStorage.getItem("token");

    console.log("RoutesPage rendered, token:", token);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString("ru-RU", {
            weekday: "short",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        });
    };

    useEffect(() => {
        console.log("RoutesPage useEffect triggered, token:", token);
        if (!token) {
            console.log("No token, redirecting to /login");
            navigate("/login");
            return;
        }

        const fetchTrips = async () => {
            try {
                console.log("Fetching trips with token:", token);
                const response = await fetch(`${API_URL}/api/trips`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log("Trips response status:", response.status);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Ошибка загрузки маршрутов: ${response.status} - ${errorText}`);
                }
                const data = await response.json();
                console.log("Fetched trips data:", data);
                console.log("Структура trips:", JSON.stringify(data, null, 2));
                setTrips(data);
            } catch (error) {
                console.error("Ошибка при загрузке маршрутов:", error);
                toast.error("Не удалось загрузить маршруты");
            }
        };
        fetchTrips();
    }, [token, navigate]);

    const handleEdit = (trip) => {
        setEditingTrip(trip.id);
        setFormData({
            title: trip.title,
            start_date: trip.start_date,
            end_date: trip.end_date,
            budget: trip.budget,
            destinations: trip.destinations || [],
        });
    };

    const handleCancelEdit = () => {
        setEditingTrip(null);
        setFormData({
            title: "",
            start_date: "",
            end_date: "",
            budget: "",
            destinations: [],
        });
        setNewDestination({ name: "", date: "", cost: "", notes: "" });
    };

    const handleAddDestination = () => {
        if (!newDestination.name || !newDestination.date || !newDestination.cost) {
            toast.error("Заполните все обязательные поля пункта назначения");
            return;
        }
        setFormData({
            ...formData,
            destinations: [...formData.destinations, { ...newDestination }],
        });
        setNewDestination({ name: "", date: "", cost: "", notes: "" });
    };

    const handleRemoveDestination = (index) => {
        setFormData({
            ...formData,
            destinations: formData.destinations.filter((_, i) => i !== index),
        });
    };

    const handleUpdate = async (tripId) => {
        if (!formData.title || !formData.start_date || !formData.end_date || !formData.budget) {
            toast.error("Заполните все поля маршрута");
            return;
        }
        if (formData.destinations.length === 0) {
            toast.error("Добавьте хотя бы один пункт назначения");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/trips/${tripId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success("Маршрут обновлен");
                setTrips(trips.map((trip) => (trip.id === tripId ? { ...formData, id: tripId } : trip)));
                handleCancelEdit();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ошибка при обновлении маршрута");
            }
        } catch (error) {
            console.error("Ошибка при обновлении:", error);
            toast.error("Ошибка сервера");
        }
    };

    const handleDelete = async (tripId) => {
        try {
            const response = await fetch(`${API_URL}/api/trips/${tripId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success("Маршрут удален");
                setTrips(trips.filter((trip) => trip.id !== tripId));
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ошибка при удалении маршрута");
            }
        } catch (error) {
            console.error("Ошибка при удалении:", error);
            toast.error("Ошибка сервера");
        }
    };

    console.log("Rendering RoutesPage, trips:", trips);
    return (
        <div className="routes-page">
            <div className="container">
                <h1 className="page-title fade-in">Мои маршруты</h1>
                {trips.length > 0 ? (
                    <div className="trip-grid">
                        {trips.map((trip) => (
                            <div key={trip.id} className="trip-card card fade-in">
                                {editingTrip === trip.id ? (
                                    <div className="edit-form">
                                        <div className="form-group">
                                            <label className="form-label">Название маршрута:</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.title}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, title: e.target.value })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Дата начала:</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.start_date}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, start_date: e.target.value })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Дата окончания:</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.end_date}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, end_date: e.target.value })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Бюджет (руб.):</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={formData.budget}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, budget: e.target.value })
                                                }
                                                required
                                            />
                                        </div>

                                        <h5 className="section-title">Пункты Назначения</h5>
                                        <div className="form-group">
                                            <label className="form-label">Название:</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newDestination.name}
                                                onChange={(e) =>
                                                    setNewDestination({ ...newDestination, name: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Дата:</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={newDestination.date}
                                                onChange={(e) =>
                                                    setNewDestination({ ...newDestination, date: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Стоимость (руб.):</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={newDestination.cost}
                                                onChange={(e) =>
                                                    setNewDestination({ ...newDestination, cost: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Заметки:</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newDestination.notes}
                                                onChange={(e) =>
                                                    setNewDestination({ ...newDestination, notes: e.target.value })
                                                }
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-secondary add-destination-btn"
                                            onClick={handleAddDestination}
                                        >
                                            Добавить пункт назначения
                                        </button>

                                        {formData.destinations.length > 0 && (
                                            <ul className="destination-list">
                                                {formData.destinations.map((dest, index) => (
                                                    <li key={index} className="destination-item">
                                                        <span>
                                                            {dest.name} ({formatDate(dest.date)}) - {dest.cost} руб.{" "}
                                                            {dest.notes && `(${dest.notes})`}
                                                        </span>
                                                        <button
                                                            className="btn btn-danger remove-destination-btn"
                                                            onClick={() => handleRemoveDestination(index)}
                                                        >
                                                            Удалить
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <div className="edit-actions">
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleUpdate(trip.id)}
                                            >
                                                Сохранить
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={handleCancelEdit}
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="trip-details">
                                        <h3 className="trip-title">{trip.title}</h3>
                                        <p className="trip-dates">
                                            <strong>Даты:</strong> {formatDate(trip.start_date)} -{" "}
                                            {formatDate(trip.end_date)}
                                        </p>
                                        <p className="trip-budget">
                                            <strong>Бюджет:</strong> {trip.budget} руб.
                                        </p>
                                        <div className="trip-destinations">
                                            <strong>Точки:</strong>
                                            <ul>
                                                {trip.destinations && trip.destinations.length > 0 ? (
                                                    trip.destinations.map((dest) => (
                                                        <li key={dest.id || Math.random()}>
                                                            {dest.name} ({formatDate(dest.date)}) - Стоимость:{" "}
                                                            {dest.cost} руб.
                                                            {dest.notes && <span> - {dest.notes}</span>}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li>Нет пунктов назначения</li>
                                                )}
                                            </ul>
                                        </div>
                                        <div className="trip-actions">
                                            <button
                                                className="btn btn-secondary edit-btn"
                                                onClick={() => handleEdit(trip)}
                                            >
                                                Редактировать
                                            </button>
                                            <button
                                                className="btn btn-danger delete-btn"
                                                onClick={() => handleDelete(trip.id)}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-trips fade-in">У вас пока нет маршрутов.</p>
                )}
            </div>
        </div>
    );
};

export default RoutesPage;