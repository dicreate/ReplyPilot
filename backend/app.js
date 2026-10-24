const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const analyticsRoutes = require("./routes/analyticsRoutes");
const authRoutes = require("./routes/authRoutes.js");
const commentRoutes = require("./routes/commentRoute.js");
const keywordRoutes = require("./routes/keywordRoutes.js");
const mediaRoutes = require("./routes/mediaRoutes.js");
const healthRoutes = require("./routes/healthRoutes.js");
const complianceRoutes = require("./routes/complianceRoutes.js");
const webhookRoutes = require("./routes/webhookRoutes.js");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Локалка: .env.local приоритетнее .env (его патчит `yarn tunnels`).
// dotenv не перезаписывает уже выставленные переменные, поэтому сначала local.
// В проде (Render) обоих файлов нет — значения берутся из dashboard.
dotenv.config({ path: ".env.local" });
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "INSTAGRAM_CLIENT_ID",
  "INSTAGRAM_CLIENT_SECRET",
  "INSTAGRAM_REDIRECT_URI",
  "MONGO_URI",
  "JWT_SECRET",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

// Connect to MongoDB.
// В тестах (NODE_ENV=test, Jest выставляет сам) не коннектимся к реальной
// базе: tests/setup.js поднимает in-memory Mongo, а импорт app иначе ронял
// сьют с "Can't call openUri() on an active connection" и писал в прод-БД.
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// Trust proxy for ngrok/tunneling services
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.instagram.com",
          "https://graph.instagram.com",
        ],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Compression middleware
app.use(compression());

// CORS configuration
// ВАЖНО: страница callback'а открывается по redirect_uri, т.е. сейчас с origin
// туннеля фронта. Если его нет в списке — браузер режет POST /api/auth/instagram
// (в Network это выглядит как CORS/preflight error, фронт показывает
// "Authentication failed"). Quick-туннели меняют URL при рестарте — не забудь обновить.
const FRONTEND_TUNNEL_URL = "https://busy-needs-hosts-christina.trycloudflare.com";
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          process.env.FRONTEND_URL || "https://yourdomain.com",
          "https://xr9mbjzk-5173.inc1.devtunnels.ms",
          FRONTEND_TUNNEL_URL,
        ]
      : [
          "http://localhost:3000",
          "http://localhost:5173",
          "https://xr9mbjzk-5173.inc1.devtunnels.ms",
          FRONTEND_TUNNEL_URL,
        ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
};

// Chrome Private Network Access: когда фронт открыт с публичного URL (туннель),
// а API дергается на localhost, Chrome требует этот заголовок уже в preflight.
// Стоит ДО cors: preflight отвечает сам cors-middleware и дальше next() не идет.
// Без заголовка fetch падает как Network Error, хотя curl чистый.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Private-Network", "true");
  next();
});

app.use(cors(corsOptions));

 // Webhook endpoints (for Instagram events) — ДО bodyParser:
 // Meta подписывает сырые байты, поэтому нужен express.raw. bodyParser.json
 // превратил бы тело в Object, и проверка подписи падала бы с
 // 'The "data" argument must be of type string or Buffer'.
 app.use("/webhook", express.raw({ type: "application/json" }), webhookRoutes);

 // Body parsing with size limits
 app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: {
    success: false,
    error: {
      message: "Too many requests, please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 20 : 100,
  message: {
    success: false,
    error: {
      message:
        "Too many requests to sensitive endpoint, please try again later.",
      code: "STRICT_RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth-specific rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 50,
  message: {
    success: false,
    error: {
      message: "Too many authentication attempts, please try again later.",
      code: "AUTH_RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Health checks (no rate limiting for monitoring)
app.use("/health", healthRoutes);

 // Compliance endpoints (required by Facebook)
 app.use("/api/compliance", complianceRoutes);

 // (webhook смонтирован выше, до bodyParser — см. комментарий там)

// Apply specific rate limiters to routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/comments", strictLimiter, commentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/keywords", keywordRoutes);
app.use("/api/media", strictLimiter, mediaRoutes);

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
