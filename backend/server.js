const app = require("./app.js");
const PORT = process.env.PORT || 5000;
const dotenv = require("dotenv");

dotenv.config();

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});