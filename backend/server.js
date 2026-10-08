const app = require("./app.js");
const PORT = process.env.PORT || 5000;
const dotenv = require("dotenv");

// Тот же порядок, что и в app.js: .env.local (локалка) поверх .env (прод-референс)
dotenv.config({ path: ".env.local" });
dotenv.config();

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});