const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const routes = require("./routes");
const logger = require("./middleware/logger");
const rateLimiter = require("./middleware/rateLimiter");
const { notFound, errorHandler } = require("./middleware/errorHandler");

dotenv.config({ override: true });

const app = express();
const frontendRoot = path.join(__dirname, "..", "frontend");
const frontendPagesRoot = path.join(frontendRoot, "pages");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(rateLimiter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    message: "WorkLink API is running"
  });
});

app.use("/api", routes);
app.use(express.static(frontendRoot));

app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendPagesRoot, "index.html"));
});

app.get("*.html", (req, res, next) => {
  const filePath = path.join(frontendPagesRoot, req.path);
  res.sendFile(filePath, (error) => {
    if (error) {
      next();
    }
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5003;

let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Update PORT in backend/.env or stop the process using it.`);
      process.exit(1);
    }

    throw error;
  });
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error(`Unhandled rejection: ${error.message}`);
  if (server) {
    server.close(() => process.exit(1));
    return;
  }

  process.exit(1);
});
