import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

import plaidRoutes from "./routes/plaidRoutes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Plaid Authentication API is running!",
    version: "2020-09-14",
    status: "healthy",
  });
});

// API routes
app.use("/api/plaid", plaidRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Plaid Authentication API running on port ${PORT}`);
  console.log(`Make sure to set up your .env file with Plaid credentials`);
  console.log(`Visit http://localhost:${PORT} to test the API`);
});

export default app;
