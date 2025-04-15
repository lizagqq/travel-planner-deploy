import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AdminPanel = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [newTrip, setNewTrip] = useState({
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
    const [editingTrip, setEditingTrip] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchTrips = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/predefined-trips", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setTrips(data);
                } else {
                    toast.error("Ошибка при загрузке маршрутов");
                }
            } catch (error) {
                toast.error("Ошибка сервера");
            }
        };

        fetchTrips();
    }, [token, navigate]);

    const handleAddDestination = () => {
        if (!newDestination.name || !newDestination.date || !newDestination.cost) {
            toast.error("Заполните все обязательные поля пункта назначения");
            return;
        }
        setNewTrip({
            ...newTrip,
            destinations: [...newTrip.destinations, { ...newDestination }],
        });
        setNewDestination({ name: "", date: "", cost: "", notes: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newTrip.title || !newTrip.start_date || !newTrip.end_date || !newTrip.budget) {
            toast.error("Заполните все поля маршрута");
            return;
        }
        if (newTrip.destinations.length === 0) {
            toast.error("Добавьте хотя бы один пункт назначения");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/predefined-trips", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newTrip),
            });

            if (response.ok) {
                toast.success("Маршрут добавлен");
                const data = await response.json();
                setTrips([...trips, data.trip]);
                setNewTrip({ title: "", start_date: "", end_date: "", budget: "", destinations: [] });
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ошибка при добавлении маршрута");
            }
        } catch (error) {
            toast.error("Ошибка сервера");
        }
    };

    const handleEdit = (trip) => {
        setEditingTrip(trip);
        setNewTrip({
            title: trip.title,
            start_date: trip.start_date,
            end_date: trip.end_date,
            budget: trip.budget,
            destinations: trip.destinations,
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/api/predefined-trips/${editingTrip.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newTrip),
            });

            if (response.ok) {
                toast.success("Маршрут обновлен");
                setTrips(trips.map((t) => (t.id === editingTrip.id ? { ...newTrip, id: editingTrip.id } : t)));
                setEditingTrip(null);
                setNewTrip({ title: "", start_date: "", end_date: "", budget: "", destinations: [] });
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ошибка при обновлении маршрута");
            }
        } catch (error) {
            toast.error("Ошибка сервера");
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/predefined-trips/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success("Маршрут удален");
                setTrips(trips.filter((t) => t.id !== id));
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ошибка при удалении маршрута");
            }
        } catch (error) {
            toast.error("Ошибка сервера");
        }
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center mb-4">Панель администратора</h1>

            {/* Форма добавления/редактирования маршрута */}
            <div className="card p-4 mb-4">
                <h2 className="h4 mb-3">{editingTrip ? "Редактировать маршрут" : "Добавить новый маршрут"}</h2>
                <form onSubmit={editingTrip ? handleUpdate : handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Название маршрута:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newTrip.title}
                            onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Дата начала:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={newTrip.start_date}
                            onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Дата окончания:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={newTrip.end_date}
                            onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Бюджет (руб.):</label>
                        <input
                            type="number"
                            className="form-control"
                            value={newTrip.budget}
                            onChange={(e) => setNewTrip({ ...newTrip, budget: e.target.value })}
                            required
                        />
                    </div>

                    {/* Добавление пунктов назначения */}
                    <h3 className="h5 mb-3">Пункты назначения</h3>
                    <div className="mb-3">
                        <label className="form-label">Название:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newDestination.name}
                            onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Дата:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={newDestination.date}
                            onChange={(e) => setNewDestination({ ...newDestination, date: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Стоимость (руб.):</label>
                        <input
                            type="number"
                            className="form-control"
                            value={newDestination.cost}
                            onChange={(e) => setNewDestination({ ...newDestination, cost: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
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
                        className="btn btn-secondary mb-3"
                        onClick={handleAddDestination}
                    >
                        Добавить пункт назначения
                    </button>

                    {/* Список добавленных пунктов назначения */}
                    {newTrip.destinations.length > 0 && (
                        <ul className="list-group mb-3">
                            {newTrip.destinations.map((dest, index) => (
                                <li key={index} className="list-group-item">
                                    {dest.name} ({dest.date}) - {dest.cost} руб. {dest.notes && `(${dest.notes})`}
                                </li>
                            ))}
                        </ul>
                    )}

                    <button type="submit" className="btn btn-primary">
                        {editingTrip ? "Обновить маршрут" : "Добавить маршрут"}
                    </button>
                    {editingTrip && (
                        <button
                            type="button"
                            className="btn btn-secondary ms-2"
                            onClick={() => {
                                setEditingTrip(null);
                                setNewTrip({ title: "", start_date: "", end_date: "", budget: "", destinations: [] });
                            }}
                        >
                            Отмена
                        </button>
                    )}
                </form>
            </div>

            {/* Список маршрутов */}
            <h2 className="text-center mb-4">Существующие маршруты</h2>
            {trips.length > 0 ? (
                <div className="row">
                    {trips.map((trip) => (
                        <div key={trip.id} className="col-md-4 mb-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <h5 className="card-title">{trip.title}</h5>
                                    <p className="card-text">
                                        <strong>Даты:</strong> {trip.start_date} - {trip.end_date}
                                    </p>
                                    <p className="card-text">
                                        <strong>Бюджет:</strong> {trip.budget} руб.
                                    </p>
                                    <div>
                                        <strong>Пункты назначения:</strong>
                                        <ul>
                                            {trip.destinations.map((dest) => (
                                                <li key={dest.id}>
                                                    {dest.name} ({dest.date}) - Стоимость: {dest.cost} руб.
                                                    {dest.notes && <span> - {dest.notes}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        className="btn btn-warning btn-sm me-2"
                                        onClick={() => handleEdit(trip)}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(trip.id)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center">Маршруты отсутствуют.</p>
            )}
        </div>
    );
};

export default AdminPanel;