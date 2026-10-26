
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:4200"
}));

app.use(express.json());

app.use("/api/users", userRoutes);

app.get("/", (_req, res) => {
    res.send("API de CarWeb funcionando");
});

export default app;
