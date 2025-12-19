import express from "express";
import cors from "cors";
import ordersRoutes from "./routes/orders.routes.js";
const app = express();
const port = 3000;

// اجازه دسترسی فقط به فرانت
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:3000", "http://192.168.100.10:8080"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Idempotency-Key"],
  })
);

app.use(express.json());

// Use the orders routes for handling orders
app.use(ordersRoutes); // Make sure you're using the correct routes

// Serve static files (like frontend assets)
// app.use(express.static("frontend"));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
