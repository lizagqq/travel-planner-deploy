import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Home.css";
import { API_URL } from "../config";

// Функции форматирования (оставляем без изменений)
const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).replace(",", "");
};

const extractDate = (isoString) => {
    if (!isoString) return "";
    return isoString.split("T")[0];
};

const extractTime = (isoString) => {
    if (!isoString) return "";
    const timePart = isoString.split("T")[1];
    return timePart ? timePart.slice(0, 5) : "";
};

const toISOString = (date, time) => {
    if (!date) return "";
    const dateTime = time ? `${date}T${time}:00.000Z` : `${date}T00:00:00.000Z`;
    return new Date(dateTime).toISOString();
};

const Home = () => {
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [editingRoute, setEditingRoute] = useState(null);
    const [creatingRoute, setCreatingRoute] = useState(false); // Новое состояние для создания маршрута
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
        time: "",
        cost: "",
        notes: "",
        category: "Транспорт",
    });
    const [editingDestinationIndex, setEditingDestinationIndex] = useState(null);
    const [editingDestination, setEditingDestination] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                if (response.ok) setUserRole(data.role);
                else toast.error(data.error || "Ошибка при получении данных пользователя");
            } catch (error) {
                console.error("Ошибка при запросе /api/user/me:", error);
                toast.error("Ошибка сервера");
            }
        };

        const fetchRoutes = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/predefined-trips`, {
                    headers: { "Content-Type": "application/json" },
                });
                const data = await response.json();
                if (response.ok) setRoutes(data);
                else toast.error(data.error || "Ошибка при загрузке маршрутов");
            } catch (error) {
                console.error("Ошибка при запросе /api/predefined-trips:", error);
                toast.error("Ошибка сервера");
            }
        };

        if (token) fetchUserRole();
        fetchRoutes();
    }, [token]);

    const handleAddDestination = () => {
        if (!newDestination.name || !newDestination.date || !newDestination.time || !newDestination.cost || !newDestination.category) {
            toast.error("Заполните все обязательные поля пункта назначения");
            return;
        }
        const isoDateTime = toISOString(newDestination.date, newDestination.time);
        setFormData({
            ...formData,
            destinations: [...formData.destinations, { ...newDestination, date: isoDateTime }],
        });
        setNewDestination({ name: "", date: "", time: "", cost: "", notes: "", category: "Транспорт" });
    };

    const handleRemoveDestination = (index) => {
        setFormData({
            ...formData,
            destinations: formData.destinations.filter((_, i) => i !== index),
        });
        if (editingDestinationIndex === index) {
            setEditingDestinationIndex(null);
            setEditingDestination(null);
        }
    };

    const handleEditDestination = (index) => {
        const dest = formData.destinations[index];
        setEditingDestinationIndex(index);
        setEditingDestination({
            ...dest,
            date: extractDate(dest.date),
            time: extractTime(dest.date),
        });
    };

    const handleUpdateDestination = () => {
        if (!editingDestination.name || !editingDestination.date || !editingDestination.time || !editingDestination.cost || !editingDestination.category) {
            toast.error("Заполните все обязательные поля пункта назначения");
            return;
        }
        const updatedDestinations = [...formData.destinations];
        const isoDateTime = toISOString(editingDestination.date, editingDestination.time);
        updatedDestinations[editingDestinationIndex] = { ...editingDestination, date: isoDateTime };
        setFormData({ ...formData, destinations: updatedDestinations });
        setEditingDestinationIndex(null);
        setEditingDestination(null);
    };

    const handleCancelEditDestination = () => {
        setEditingDestinationIndex(null);
        setEditingDestination(null);
    };

    const handleEditRoute = (route) => {
        setEditingRoute(route.id);
        setFormData({
            title: route.title,
            start_date: route.start_date,
            end_date: route.end_date,
            budget: route.budget,
            destinations: route.destinations || [],
        });
    };

    const handleCancelEditRoute = () => {
        setEditingRoute(null);
        setCreatingRoute(false); // Сбрасываем создание
        setFormData({ title: "", start_date: "", end_date: "", budget: "", destinations: [] });
        setNewDestination({ name: "", date: "", time: "", cost: "", notes: "", category: "Транспорт" });
    };

    const handleUpdateRoute = async (routeId) => {
        if (!formData.title || !formData.start_date || !formData.end_date || !formData.budget) {
            toast.error("Заполните все поля маршрута");
            return;
        }
        if (formData.destinations.length === 0) {
            toast.error("Добавьте хотя бы один пункт назначения");
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/predefined-trips/${routeId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                const updatedRoute = await response.json();
                setRoutes(routes.map((route) => (route.id === routeId ? updatedRoute : route)));
                toast.success("Маршрут успешно обновлен!");
                handleCancelEditRoute();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ошибка при обновлении маршрута");
            }
        } catch (error) {
            toast.error("Ошибка сервера");
        }
    };

    const handleDeleteRoute = async (routeId) => {
        if (!window.confirm("Вы уверены, что хотите удалить этот маршрут?")) return;
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/predefined-trips/${routeId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                setRoutes(routes.filter((route) => route.id !== routeId));
                toast.success("Маршрут успешно удален!");
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ошибка при удалении маршрута");
            }
        } catch (error) {
            toast.error("Ошибка сервера");
        }
    };

    // Новая функция для создания маршрута
    const handleCreateRoute = async () => {
        if (!formData.title || !formData.start_date || !formData.end_date || !formData.budget) {
            toast.error("Заполните все поля маршрута");
            return;
        }
        if (formData.destinations.length === 0) {
            toast.error("Добавьте хотя бы один пункт назначения");
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/predefined-trips`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...formData, isPublic: true }), // Устанавливаем isPublic: true
            });
            if (response.ok) {
                const newRoute = await response.json();
                setRoutes([...routes, newRoute]);
                toast.success("Маршрут успешно создан!");
                handleCancelEditRoute();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ошибка при создании маршрута");
            }
        } catch (error) {
            toast.error("Ошибка сервера");
        }
    };

    return (
        <div className="home-page">
            <div className="container">
                <h1 className="page-title fade-in">Готовые маршруты</h1>
                {userRole === "admin" && (
                    <button
                        className="btn btn-primary create-btn"
                        onClick={() => setCreatingRoute(true)}
                    >
                        Создать маршрут
                    </button>
                )}
                {(editingRoute || creatingRoute) && (
                    <div className="edit-form card fade-in">
                        <h5>{creatingRoute ? "Создание нового маршрута" : "Редактирование маршрута"}</h5>
                        <div className="form-group">
                            <label className="form-label">Название маршрута:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Дата и время начала:</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={formData.start_date ? formData.start_date.slice(0, 16) : ""}
                                onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Дата и время окончания:</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={formData.end_date ? formData.end_date.slice(0, 16) : ""}
                                onChange={(e) => setFormData({ ...formData, end_date: new Date(e.target.value).toISOString() })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Бюджет (руб.):</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                required
                            />
                        </div>
                        <h5 className="section-title">Пункты назначения</h5>
                        <div className="form-group">
                            <label className="form-label">Название:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={newDestination.name}
                                onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Дата:</label>
                            <input
                                type="date"
                                className="form-control"
                                value={newDestination.date}
                                onChange={(e) => setNewDestination({ ...newDestination, date: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Время:</label>
                            <input
                                type="time"
                                className="form-control"
                                value={newDestination.time}
                                onChange={(e) => setNewDestination({ ...newDestination, time: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Категория:</label>
                            <select
                                className="form-control"
                                value={newDestination.category}
                                onChange={(e) => setNewDestination({ ...newDestination, category: e.target.value })}
                            >
                                <option value="Транспорт">Транспорт</option>
                                <option value="Проживание">Проживание</option>
                                <option value="Еда">Еда</option>
                                <option value="Развлечения">Развлечения</option>
                                <option value="Прочее">Прочее</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Стоимость (руб.):</label>
                            <input
                                type="number"
                                className="form-control"
                                value={newDestination.cost}
                                onChange={(e) => setNewDestination({ ...newDestination, cost: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Заметки:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={newDestination.notes}
                                onChange={(e) => setNewDestination({ ...newDestination, notes: e.target.value })}
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
                                {formData.destinations
                                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                                    .map((dest, index) => (
                                        <li key={index} className="destination-item">
                                            <span>
                                                {dest.name} ({formatDateTime(dest.date)}) - {dest.category}: {dest.cost} руб.{" "}
                                                {dest.notes && `(${dest.notes})`}
                                            </span>
                                            <div>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary edit-destination-btn"
                                                    onClick={() => handleEditDestination(index)}
                                                >
                                                    Редактировать
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger remove-destination-btn"
                                                    onClick={() => handleRemoveDestination(index)}
                                                >
                                                    Удалить
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                            </ul>
                        )}
                        {editingDestinationIndex !== null && editingDestination && (
                            <div className="edit-destination-form">
                                <h5 className="section-title">Редактировать пункт назначения</h5>
                                <div className="form-group">
                                    <label className="form-label">Название:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingDestination.name}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Дата:</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={editingDestination.date}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Время:</label>
                                    <input
                                        type="time"
                                        className="form-control"
                                        value={editingDestination.time}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, time: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Категория:</label>
                                    <select
                                        className="form-control"
                                        value={editingDestination.category}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, category: e.target.value })}
                                    >
                                        <option value="Транспорт">Транспорт</option>
                                        <option value="Проживание">Проживание</option>
                                        <option value="Еда">Еда</option>
                                        <option value="Развлечения">Развлечения</option>
                                        <option value="Прочее">Прочее</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Стоимость (руб.):</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={editingDestination.cost}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, cost: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Заметки:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingDestination.notes}
                                        onChange={(e) => setEditingDestination({ ...editingDestination, notes: e.target.value })}
                                    />
                                </div>
                                <div className="edit-actions">
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={handleUpdateDestination}
                                    >
                                        Сохранить
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCancelEditDestination}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="edit-actions">
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => (creatingRoute ? handleCreateRoute() : handleUpdateRoute(editingRoute))}
                            >
                                {creatingRoute ? "Создать маршрут" : "Сохранить маршрут"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCancelEditRoute}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                )}
                {routes.length === 0 && !creatingRoute ? (
                    <p className="no-routes">Маршруты отсутствуют.</p>
                ) : (
                    routes.map((route) => (
                        <div key={route.id} className="route-card card fade-in">
                            <div className="route-details">
                                <h3 className="route-title">{route.title}</h3>
                                <p className="route-dates">
                                    <strong>Даты:</strong> {formatDateTime(route.start_date)} - {formatDateTime(route.end_date)}
                                </p>
                                <p className="route-budget">
                                    <strong>Бюджет:</strong> {route.budget} руб.
                                </p>
                                <div className="route-destinations">
                                    <strong>Пункты назначения:</strong>
                                    <ul>
                                        {route.destinations && route.destinations.length > 0 ? (
                                            route.destinations
                                                .sort((a, b) => new Date(a.date) - new Date(b.date))
                                                .map((dest) => (
                                                    <li key={dest.id}>
                                                        {dest.name} ({formatDateTime(dest.date)}) - {dest.category}: {dest.cost} руб.
                                                        {dest.notes && <span> - {dest.notes}</span>}
                                                    </li>
                                                ))
                                        ) : (
                                            <li>Нет пунктов назначения</li>
                                        )}
                                    </ul>
                                </div>
                                {userRole === "admin" && (
                                    <div className="route-actions">
                                        <button
                                            className="btn btn-secondary edit-btn"
                                            onClick={() => handleEditRoute(route)}
                                        >
                                            Редактировать
                                        </button>
                                        <button
                                            className="btn btn-danger delete-btn"
                                            onClick={() => handleDeleteRoute(route.id)}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Home;
