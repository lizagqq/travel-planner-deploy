const pool = require("../db");

const getPredefinedTrips = async (req, res) => {
    try {
        const trips = await pool.query("SELECT * FROM predefined_trips");
        const result = await Promise.all(trips.rows.map(async (trip) => {
            const destinations = await pool.query("SELECT * FROM predefined_destinations WHERE trip_id = $1", [trip.id]);
            return { ...trip, destinations: destinations.rows };
        }));
        res.json(result);
    } catch (error) {
        console.error("Ошибка при получении готовых маршрутов:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

const addPredefinedTrip = async (req, res) => {
    const { title, start_date, end_date, budget, destinations } = req.body;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const newTrip = await client.query(
            "INSERT INTO predefined_trips (title, start_date, end_date, budget) VALUES ($1, $2, $3, $4) RETURNING id",
            [title, start_date, end_date, budget]
        );
        const tripId = newTrip.rows[0].id;

        for (const dest of destinations) {
            await client.query(
                "INSERT INTO predefined_destinations (trip_id, name, date, notes, cost) VALUES ($1, $2, $3, $4, $5)",
                [tripId, dest.name, dest.date, dest.notes || null, dest.cost]
            );
        }

        await client.query("COMMIT");
        res.status(201).json({ trip: { id: tripId, title, start_date, end_date, budget, destinations } });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Ошибка при добавлении маршрута:", error);
        res.status(500).json({ error: "Ошибка при добавлении маршрута" });
    } finally {
        client.release();
    }
};

const updatePredefinedTrip = async (req, res) => {
    const { id } = req.params;
    const { title, start_date, end_date, budget, destinations } = req.body;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            "UPDATE predefined_trips SET title = $1, start_date = $2, end_date = $3, budget = $4 WHERE id = $5",
            [title, start_date, end_date, budget, id]
        );
        await client.query("DELETE FROM predefined_destinations WHERE trip_id = $1", [id]);

        for (const dest of destinations) {
            await client.query(
                "INSERT INTO predefined_destinations (trip_id, name, date, notes, cost) VALUES ($1, $2, $3, $4, $5)",
                [id, dest.name, dest.date, dest.notes || null, dest.cost]
            );
        }

        await client.query("COMMIT");
        res.json({ message: "Маршрут обновлен" });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Ошибка при обновлении маршрута:", error);
        res.status(500).json({ error: "Ошибка при обновлении маршрута" });
    } finally {
        client.release();
    }
};

const deletePredefinedTrip = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM predefined_destinations WHERE trip_id = $1", [id]);
        await client.query("DELETE FROM predefined_trips WHERE id = $1", [id]);
        await client.query("COMMIT");
        res.json({ message: "Маршрут удален" });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Ошибка при удалении маршрута:", error);
        res.status(500).json({ error: "Ошибка при удалении маршрута" });
    } finally {
        client.release();
    }
};

module.exports = { getPredefinedTrips, addPredefinedTrip, updatePredefinedTrip, deletePredefinedTrip };