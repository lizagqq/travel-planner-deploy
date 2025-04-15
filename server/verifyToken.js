const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Токен из твоего сообщения
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc0Mzg4MDYyNCwiZXhwIjoxNzQzODg0MjI0fQ.Aem0hdSivKqNVeBf3r1yR5K3KmfeSIxU3TBd_EWBdhM";
const secret = "1111";

// Разделим токен на части
const [header, payload, signature] = token.split(".");

// Вычислим подпись
const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

console.log("Оригинальная подпись:", signature);
console.log("Вычисленная подпись:", computedSignature);
console.log("Подписи совпадают:", signature === computedSignature);

// Попробуем верифицировать токен с помощью jwt.verify
try {
    const decoded = jwt.verify(token, secret);
    console.log("Декодированный токен:", decoded);
} catch (error) {
    console.error("Ошибка при верификации токена:", error.message);
}