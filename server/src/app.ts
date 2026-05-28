import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requestLogger, errorHandler } from "./middlewares/error.middleware";
import authRouter from "./modules/auth/auth.routes";
import storeRouter from "./modules/stores/store.routes";
import productRouter from "./modules/products/product.routes";
import orderRouter from "./modules/orders/order.routes";
import paymentRouter from "./modules/payments/payment.routes";
import { PaymentController } from "./modules/payments/payment.controller";
import "./models";
import { RateLimit } from "./middlewares/rateLimit.middleware";
import {
  decryptRequestBody,
  encryptResponseBody,
  verifyHmac,
} from "./middlewares/payload.middleware";
// custom packages
import { createWaf } from "iph-waf";
import { createCsrfProtection } from "iph-csrf";
import { createSecurityHeaders } from "iph-security-headers";
import { createDeviceFingerprintMiddleware } from "iph-device-fingerprint";
import { createMemoryNonceStore, createReplayProtection } from "iph-replay-guard";
import { skipPaths } from "./utils/skip";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const app = express();

app.use(
  helmet({
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
  }),
);

app.set("trust proxy", 1);
app.use(createWaf());

app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    exposedHeaders: ["x-signature", "x-session-hmac"],
  }),
);

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.webhook,
);

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json({ limit: "120kb" }));
app.use(express.urlencoded({ extended: false, limit: "120kb" }));

app.use(requestLogger);

app.use(RateLimit.global());

app.use(createSecurityHeaders());
app.use(createDeviceFingerprintMiddleware());
const store = createMemoryNonceStore();
app.use(createReplayProtection({ store, skipPaths }));
app.use(verifyHmac);
app.use(createCsrfProtection({ skipPaths }));
app.use(decryptRequestBody);
app.use(encryptResponseBody);

app.use("/api/auth", authRouter);
app.use("/api/stores", storeRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);

app.get("/", (_: Request, res: Response) => {
  res.send("Hello World");
});

app.use(errorHandler);
