import cors from "cors";
import express, { Request, Response } from "express";
import appointmentRoutes from "./routes/appointments";
import authRoutes from "./routes/auth";
import clientRoutes from "./routes/clients";
import eventsRoutes from "./routes/events";
import googleRoutes from "./routes/google";
import projectMembersRoutes from "./routes/project-members";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/tasks";
import userRoutes from "./routes/users";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", projectMembersRoutes); // Routes pour les membres
app.use("/api/projects", taskRoutes); // Routes pour les tâches
app.use("/api/tasks", taskRoutes); // Routes pour les tâches (modification/suppression)
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes); // Routes pour les clients
app.use("/api/appointments", appointmentRoutes); // Routes pour les rendez-vous
app.use("/api/events", eventsRoutes); // Routes pour les événements
app.use("/api/google", googleRoutes); // Routes pour Google Calendar OAuth

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
