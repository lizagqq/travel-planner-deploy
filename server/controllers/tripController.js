const pool = require("../db");

const addTrip = async (req, res) => {
    const { title, start_date, end_date, budget, destinations } = req.body;
    const user_id = req.user.id;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const newTrip = await client.query(
            "INSERT INTO trips (title, start_date, end_date, budget, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [title, start_date, end_date, budget, user_id]
        );
        const tripId = newTrip.rows[0].id;
        for (const dest of destinations) {
            await client.query(
                "INSERT INTO destinations (trip_id, name, date, notes, cost) VALUES ($1, $2, $3, $4, $5)",
                [tripId, dest.name, dest.date, dest.notes, dest.cost]
            );
        }
        await client.query("COMMIT");
        res.status(201).json({ trip: { id: tripId, title, start_date, end_date, budget, user_id, destinations } });
    } catch (error) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "Ошибка при добавлении путешествия" });
    } finally {
        client.release();
    }
};

const getUserTrips = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("Fetching trips for userId:", userId); // Отладка

        // Запрос для получения маршрутов и связанных пунктов назначения
        const result = await pool.query(
            `
            SELECT 
                t.id, 
                t.title, 
                t.start_date, 
                t.end_date, 
                t.budget,
                json_agg(
                    json_build_object(
                        'id', d.id,
                        'name', d.name,
                        'date', d.date,
                        'notes', d.notes,
                        'cost', d.cost
                    )
                ) FILTER (WHERE d.id IS NOT NULL) AS destinations
            FROM trips t
            LEFT JOIN destinations d ON t.id = d.trip_id
            WHERE t.user_id = $1
            GROUP BY t.id, t.title, t.start_date, t.end_date, t.budget
            `,
            [userId]
        );

        console.log("Trips data sent:", result.rows); // Отладка
        res.json(result.rows);
    } catch (error) {
        console.error("Ошибка при получении поездок:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

const updateTrip = async (req, res) => {
    const { id } = req.params;
    const { title, start_date, end_date, budget, destinations } = req.body;
    const user_id = req.user.id;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Проверяем, что маршрут принадлежит пользователю
        const tripCheck = await client.query("SELECT * FROM trips WHERE id = $1 AND user_id = $2", [id, user_id]);
        if (tripCheck.rows.length === 0) {
            throw new Error("Маршрут не найден или у вас нет прав для его редактирования");
        }

        // Обновляем данные маршрута
        await client.query(
            "UPDATE trips SET title = $1, start_date = $2, end_date = $3, budget = $4 WHERE id = $5",
            [title, start_date, end_date, budget, id]
        );

        // Удаляем старые пункты назначения
        await client.query("DELETE FROM destinations WHERE trip_id = $1", [id]);

        // Добавляем новые пункты назначения
        for (const dest of destinations) {
            await client.query(
                "INSERT INTO destinations (trip_id, name, date, notes, cost) VALUES ($1, $2, $3, $4, $5)",
                [id, dest.name, dest.date, dest.notes || null, dest.cost]
            );
        }

        await client.query("COMMIT");
        res.json({ message: "Маршрут обновлен" });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Ошибка при обновлении маршрута:", error);
        res.status(500).json({ error: error.message || "Ошибка при обновлении маршрута" });
    } finally {
        client.release();
    }
};

const deleteTrip = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Проверяем, что маршрут принадлежит пользователю
        const tripCheck = await client.query("SELECT * FROM trips WHERE id = $1 AND user_id = $2", [id, user_id]);
        if (tripCheck.rows.length === 0) {
            throw new Error("Маршрут не найден или у вас нет прав для его удаления");
        }

        // Удаляем пункты назначения
        await client.query("DELETE FROM destinations WHERE trip_id = $1", [id]);
        // Удаляем маршрут
        await client.query("DELETE FROM trips WHERE id = $1", [id]);

        await client.query("COMMIT");
        res.json({ message: "Маршрут удален" });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Ошибка при удалении маршрута:", error);
        res.status(500).json({ error: error.message || "Ошибка при удалении маршрута" });
    } finally {
        client.release();
    }
};

module.exports = { addTrip, getUserTrips, updateTrip, deleteTrip };