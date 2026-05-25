import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { requestLogger, errorHandler } from "./middlewares/error.middleware";
import { securityHeaders } from "./middlewares/security.middleware";
import { deviceFingerprint } from "./middlewares/device.middleware";
import { replayProtection } from "./middlewares/replay.middleware";
import { encryptResponseBody } from "./middlewares/responseEncryption.middleware";
import authRouter from "./modules/auth/auth.routes";
import organizationRouter from "./modules/organizations/organization.routes";
import storeRouter from "./modules/stores/store.routes";
import productRouter from "./modules/products/product.routes";
import orderRouter from "./modules/orders/order.routes";
import paymentRouter from "./modules/payments/payment.routes";
import { PaymentController } from "./modules/payments/payment.controller";
import { verifyHmac } from "./middlewares/hmac.middleware";
import { decryptRequestBody } from "./middlewares/encryption.middleware";
import { csrfProtection } from "./middlewares/csrf.middleware";
import "./models";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", FRONTEND_URL],
      "connect-src": ["'self'", FRONTEND_URL],
      "img-src": ["'self'", "data:"],
      "style-src": ["'self'", "https:", "'unsafe-inline'"],
    },
  },
}));

app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    exposedHeaders: ["x-signature", "x-session-hmac"],
  }),
);

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), PaymentController.webhook);

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json({ limit: "120kb" }));
app.use(express.urlencoded({ extended: false, limit: "120kb" }));

app.use(requestLogger);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX ?? 120),
    standardHeaders: true,
    legacyHeaders: false,
  }),
); 

app.use(securityHeaders);
app.use(deviceFingerprint);
app.use(replayProtection);
app.use(verifyHmac);
app.use(decryptRequestBody);
app.use(csrfProtection);
app.use(encryptResponseBody);

app.use((req, res, next) => {
  if (req.path === "/api/payments/webhook") {
    return next();
  }
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/organizations", organizationRouter);
app.use("/api/stores", storeRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);

app.use(errorHandler);
