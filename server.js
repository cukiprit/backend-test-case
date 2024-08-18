import express from "express";
import { initDB } from "./config/sqlite-driver.js";
import MemberRoutes from "./routes/members.js";
import BookRoutes from "./routes/books.js";
import { swaggerSpec, swaggerUi } from "./swagger.js";

const app = express();
const PORT = 3000;

initDB().catch((err) => {
  console.error(`Failed to initialize database: ${err.message}`);
  process.exit(1);
});

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", async (req, res) => {
  res.status(200).send({ message: "Hello World" });
});

app.use("/members", MemberRoutes);
app.use("/books", BookRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger UI is available at http://localhost:${PORT}/api-docs`);
});
