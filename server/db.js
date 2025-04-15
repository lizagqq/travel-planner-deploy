const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',       //  пользователь базы данных
    host: 'localhost',      // Адрес сервера базы данных
    database: 'travel_planner', // Имя базы данных
    password: '1111',  // Пароль пользователя
    port: 5432,             // Порт подключения (по умолчанию 5432)
    ssl: false,
    
});


module.exports = pool;
const initializeDbConnection = async () => {
    try {
        // Устанавливаем кодировку для работы с базой данных
        await pool.query('SET client_encoding TO \'UTF8\'');
        console.log("Подключение к базе данных успешно установлено с кодировкой UTF-8");

        // Здесь могут быть другие запросы или операции с базой данных

    } catch (err) {
        console.error("Ошибка подключения к базе данных:", err.message);
    }
};

// Вызываем функцию инициализации
initializeDbConnection();