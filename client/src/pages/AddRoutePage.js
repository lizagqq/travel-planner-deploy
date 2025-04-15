import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AddRoutePage.css";

// Функция для форматирования даты и времени из ISO 8601 в читаемый формат
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

// Функция для извлечения даты (YYYY-MM-DD) из ISO 8601
const extractDate = (isoString) => {
    if (!isoString) return "";
    return isoString.split("T")[0];
};

// Функция для извлечения времени (HH:mm) из ISO 8601
const extractTime = (isoString) => {
    if (!isoString) return "";
    const timePart = isoString.split("T")[1];
    return timePart ? timePart.slice(0, 5) : "";
};

// Функция для преобразования даты и времени из полей ввода в ISO 8601
const toISOString = (date, time) => {
    if (!date) return "";
    const dateTime = time ? `${date}T${time}:00.000Z` : `${date}T00:00:00.000Z`;
    return new Date(dateTime).toISOString();
};

const AddRoutePage = () => {
    const navigate = useNavigate();
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

    console.log("AddRoutePage rendered, token:", token); // Отладка

    useEffect(() => {
        console.log("AddRoutePage useEffect triggered, token:", token); // Отладка
        if (!token) {
            console.log("No token, redirecting to /login");
            navigate("/login", { state: { from: "/add-route" } });
        }
    }, [token, navigate]);

    // Подсчет общей стоимости
    const totalCost = formData.destinations.reduce((sum, dest) => sum + Number(dest.cost), 0);
    const budget = Number(formData.budget);
    const isOverBudget = totalCost > budget && budget > 0;

    const handleAddDestination = () => {
        console.log("handleAddDestination called, newDestination:", newDestination); // Отладка
        if (!newDestination.name || !newDestination.date || !newDestination.time || !newDestination.cost || !newDestination.category) {
            toast.error("Заполните все обязательные поля пункта назначения");
            return;
        }

        const newTotalCost = totalCost + Number(newDestination.cost);
        if (newTotalCost > budget && budget > 0) {
            toast.warning(
                `Добавление этого пункта назначения превысит бюджет! Текущая сумма: ${newTotalCost} руб., бюджет: ${budget} руб.`
            );
        }

        const isoDateTime = toISOString(newDestination.date, newDestination.time);

        setFormData({
            ...formData,
            destinations: [
                ...formData.destinations,
                {
                    ...newDestination,
                    date: isoDateTime,
                },
            ],
        });
        setNewDestination({ name: "", date: "", time: "", cost: "", notes: "", category: "Транспорт" });
    };

    const handleRemoveDestination = (index) => {
        console.log("handleRemoveDestination called, index:", index); // Отладка
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
        console.log("handleEditDestination called, index:", index); // Отладка
        const dest = formData.destinations[index];
        setEditingDestinationIndex(index);
        setEditingDestination({
            ...dest,
            date: extractDate(dest.date),
            time: extractTime(dest.date),
        });
    };

    const handleUpdateDestination = () => {
        console.log("handleUpdateDestination called, editingDestination:", editingDestination); // Отладка
        if (
            !editingDestination.name ||
            !editingDestination.date ||
            !editingDestination.time ||
            !editingDestination.cost ||
            !editingDestination.category
        ) {
            toast.error("Заполните все обязательные поля пункта назначения");
            return;
        }

        const updatedDestinations = [...formData.destinations];
        const oldCost = Number(updatedDestinations[editingDestinationIndex].cost);
        const newCost = Number(editingDestination.cost);
        const newTotalCost = totalCost - oldCost + newCost;
        if (newTotalCost > budget && budget > 0) {
            toast.warning(
                `Обновление этого пункта назначения превысит бюджет! Текущая сумма: ${newTotalCost} руб., бюджет: ${budget} руб.`
            );
        }

        const isoDateTime = toISOString(editingDestination.date, editingDestination.time);

        updatedDestinations[editingDestinationIndex] = {
            ...editingDestination,
            date: isoDateTime,
        };

        setFormData({
            ...formData,
            destinations: updatedDestinations,
        });
        setEditingDestinationIndex(null);
        setEditingDestination(null);
    };

    const handleCancelEdit = () => {
        console.log("handleCancelEdit called"); // Отладка
        setEditingDestinationIndex(null);
        setEditingDestination(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("handleSubmit called, formData:", formData); // Отладка
        if (!formData.title || !formData.start_date || !formData.end_date || !formData.budget) {
            toast.error("Заполните все поля маршрута");
            return;
        }
        if (formData.destinations.length === 0) {
            toast.error("Добавьте хотя бы один пункт назначения");
            return;
        }

        if (isOverBudget) {
            toast.warning(`Общая стоимость (${totalCost} руб.) превышает бюджет (${budget} руб.)!`);
        }

        try {
            const response = await fetch("http://localhost:5000/api/trips", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            console.log("Submit response status:", response.status); // Отладка
            if (response.ok) {
                toast.success("Маршрут успешно добавлен!");
                navigate("/routes");
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ошибка при добавлении маршрута");
            }
        } catch (error) {
            console.error("Ошибка при отправке:", error);
            toast.error("Ошибка сервера");
        }
    };

    console.log("Rendering AddRoutePage, formData:", formData); // Отладка
    return (
        <div className="add-route-page">
            <div className="container">
                <h1 className="page-title fade-in">Добавить новый маршрут</h1>
                <form onSubmit={handleSubmit} className="add-route-form card fade-in">
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

                    <h5 className="section-title">Чем займемся?</h5>
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
                        Добавить
                    </button>

                    {editingDestinationIndex !== null && editingDestination && (
                        <div className="edit-destination-form">
                            <h5 className="section-title">Редактировать пункт назначения</h5>
                            <div className="form-group">
                                <label className="form-label">Название:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editingDestination.name}
                                    onChange={(e) =>
                                        setEditingDestination({ ...editingDestination, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Дата:</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={editingDestination.date}
                                    onChange={(e) =>
                                        setEditingDestination({ ...editingDestination, date: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Время:</label>
                                <input
                                    type="time"
                                    className="form-control"
                                    value={editingDestination.time}
                                    onChange={(e) =>
                                        setEditingDestination({ ...editingDestination, time: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Категория:</label>
                                <select
                                    className="form-control"
                                    value={editingDestination.category}
                                    onChange={(e) =>
                                        setEditingDestination({ ...editingDestination, category: e.target.value })
                                    }
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
                                    onChange={(e) =>
                                        setEditingDestination({ ...editingDestination, cost: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Заметки:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editingDestination.notes}
                                    onChange={(e) =>
                                        setEditingDestination({ ...editingDestination, notes: e.target.value })
                                    }
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
                                    onClick={handleCancelEdit}
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    )}

                    {formData.destinations.length > 0 && (
                        <>
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
                            <div className={`budget-summary ${isOverBudget ? "over-budget" : ""}`}>
                                <p>
                                    Общая стоимость: <span>{totalCost} руб.</span>
                                </p>
                                <p>
                                    Бюджет: <span>{budget} руб.</span>
                                </p>
                                <p>
                                    Остаток: <span>{budget > 0 ? budget - totalCost : 0} руб.</span>
                                </p>
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary submit-btn">
                        Сохранить маршрут
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddRoutePage;